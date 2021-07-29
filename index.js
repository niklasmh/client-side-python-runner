const defaultPythonEngine = 'pyodide';

const URLS = {
  pyodide: {
    loader: 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/pyodide.js',
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/',
  },
  skulpt: {
    loader: 'https://cdn.jsdelivr.net/npm/skulpt@latest/dist/skulpt.min.js',
    library: 'https://cdn.jsdelivr.net/npm/skulpt@latest/dist/skulpt-stdlib.js',
  },
  brython: {
    loader:
      'https://cdn.jsdelivr.net/npm/brython-runner/lib/brython-runner.bundle.js',
  },
};

window.pythonRunner = window.pythonRunner || {
  loadedEngines: {},
  loadingEngines: {},
  loadingScripts: {},
  debug: false, // Turn on logging of important actions
  debugFunction: null,
  currentEngine: defaultPythonEngine,
  options: {
    output: console.log,
    error: null,
    input: window.prompt,
    pythonVersion: 3,
    loadVariablesBeforeRun: true,
    storeVariablesAfterRun: true,
    onLoading: (engine) => {},
    onLoaded: (engine) => {},
  },
};

const log = function (input, color = '#aaa', style = 'font-weight:bold') {
  console.log('%c' + input, `color:${color};${style}`);
  if (window.pythonRunner.debugFunction)
    window.pythonRunner.debugFunction(input + '\n');
};

window.pythonRunner.hasEngine = function (engine) {
  return engine in window.pythonRunner.loadedEngines;
};

window.pythonRunner.isLoadingEngine = function (engine) {
  return engine in window.pythonRunner.loadingEngines;
};

window.pythonRunner.getOptions = function () {
  return window.pythonRunner.options;
};

window.pythonRunner.setOptions = function (options) {
  if ('pythonVersion' in options) {
    if ('skulpt' in pythonRunner.loadedEngines) {
      window.Sk.configure({
        __future__:
          options.pythonVersion === 2 ? window.Sk.python2 : window.Sk.python3,
      });
    }
  }
  window.pythonRunner.options = { ...window.pythonRunner.options, ...options };
};

window.pythonRunner.setEngine = async function (engine) {
  if (!window.pythonRunner.hasEngine(engine)) {
    if (!(await window.pythonRunner.loadEngine(engine))) {
      return false;
    }
  }
  window.pythonRunner.currentEngine = engine;
  if (window.pythonRunner.debug)
    log('Using the ' + engine + ' engine', 'orange');
  return true;
};

async function loadScript(url, timeout = 20000) {
  return new Promise((resolve, reject) => {
    if (url in window.pythonRunner.loadingScripts) {
      resolve(false);
      return;
    }

    window.pythonRunner.loadingScripts[url] = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    document.head.appendChild(script);

    const timeoutID = setTimeout(() => {
      window.pythonRunner.loadingScripts[url] = false;
      reject('Used too much time to load ' + url);
    }, timeout);

    script.addEventListener('error', () => {
      window.pythonRunner.loadingScripts[url] = false;
      reject('An error occured when loading script: ' + url);
    });

    script.addEventListener('load', () => {
      window.pythonRunner.loadingScripts[url] = false;
      clearTimeout(timeoutID);
      resolve(true);
    });
  });
}

async function untilTheEngineIsLoaded(engine) {
  if (!window.pythonRunner.loadedEngines[engine]) {
    return await new Promise((resolve, reject) => {
      window.pythonRunner.loadingEngines[engine].push((couldNotLoad) => {
        if (couldNotLoad) reject();
        else resolve();
      });
    });
  } else {
    return;
  }
}

function interpretErrorMessage(error, code, engine) {
  const codeLines = code.split('\n');

  let type = null;
  let message = null;
  let line = null;
  let lineNumber = null;
  let columnNumber = null;

  if (engine === 'pyodide') {
    const lines = error.message.trim().split('\n');
    const lastLine = lines.pop();

    // Get error type
    [type, ...message] = lastLine.split(': ');
    message = message.join(': ');

    // Get context information if it exists
    const secondLastLine = lines.pop();
    if (/^ +\^/.test(secondLastLine)) {
      // We now know the line above has line information
      const thirdLastLine = lines.pop();
      columnNumber = thirdLastLine.length - 4;

      // We can also now get line number
      const fourthLastLine = lines.pop();
      const extractLineNumber = new RegExp('line ([0-9]+)');
      try {
        lineNumber = parseInt(extractLineNumber.exec(fourthLastLine)[1]);

        // As we now have the line number we can get the line too
        line = codeLines[lineNumber - 1];
      } catch (ex) {}
    } else if (/^  \[/.test(secondLastLine)) {
      // We now know the line above has line number
      const thirdLastLine = lines.pop();
      const extractLineNumber = new RegExp('line ([0-9]+)');
      try {
        lineNumber = parseInt(extractLineNumber.exec(thirdLastLine)[1]);

        // As we now have the line number we can get the line too
        line = codeLines[lineNumber - 1];
      } catch (ex) {}
    } else {
      const extractLineNumber = new RegExp('line ([0-9]+)');
      try {
        lineNumber = parseInt(extractLineNumber.exec(secondLastLine)[1]);

        // As we now have the line number we can get the line too
        line = codeLines[lineNumber - 1];
      } catch (ex) {}
    }
  } else if (engine === 'skulpt') {
    // Get error type
    [type, ...message] = error.split(': ');
    message = message.join(': ');

    try {
      let lineInfo;
      [message, lineInfo] = message.split(' on line ');
      const extractLineNumber = new RegExp('^([0-9]+)');
      lineNumber = parseInt(extractLineNumber.exec(lineInfo)[1]);

      // As we now have the line number we can get the line too
      line = codeLines[lineNumber - 1];
    } catch (ex) {}
  } else if (engine === 'brython') {
    // Get error type
    const trimmed = error.trim();
    const lines = trimmed.split('\n');
    const lastLine = lines.pop();
    [type, ...message] = lastLine.split(': ');
    message = message.join(': ');

    try {
      const lineInfo = trimmed.split(' line ')[1];
      const extractLineNumber = new RegExp('^([0-9]+)');
      lineNumber = parseInt(extractLineNumber.exec(lineInfo)[1]);

      // As we now have the line number we can get the line too
      line = codeLines[lineNumber - 1];
    } catch (ex) {}
  }

  return {
    columnNumber,
    engine,
    error,
    code,
    getNLinesAbove: (n) =>
      lineNumber === null
        ? []
        : codeLines.slice(lineNumber - 1 - n, lineNumber - 1),
    getNLinesBelow: (n) =>
      lineNumber === null ? [] : codeLines.slice(lineNumber, lineNumber + n),
    line,
    lineNumber,
    message,
    type,
  };
}

window.pythonRunner.loadEngine = async function (
  engine = window.pythonRunner.currentEngine,
  { useEngine = false } = {}
) {
  if (window.pythonRunner.hasEngine(engine)) {
    if (useEngine) window.pythonRunner.currentEngine = engine;
    return true;
  }

  if (window.pythonRunner.debug) {
    log('Loading ' + engine + '...');
  }

  if (useEngine) {
    window.pythonRunner.currentEngine = engine;
  }

  if (window.pythonRunner.isLoadingEngine(engine)) {
    try {
      await untilTheEngineIsLoaded(engine);
      return true;
    } catch (err) {
      return false;
    }
  }

  window.pythonRunner.loadingEngines[engine] = [];
  window.pythonRunner.options.onLoading(engine);

  switch (engine) {
    case 'pyodide': {
      const scriptWasLoaded = await loadScript(URLS.pyodide.loader);
      if (!scriptWasLoaded) return false;
      await window.loadPyodide({ indexURL: URLS.pyodide.indexURL });
      createPyodideRunner();
      break;
    }

    case 'skulpt': {
      const script1WasLoaded = await loadScript(URLS.skulpt.loader);
      const script2WasLoaded = await loadScript(URLS.skulpt.library);
      if (!script1WasLoaded || !script2WasLoaded) return false;
      createSkulptRunner();
      break;
    }

    case 'brython': {
      const scriptWasLoaded = await loadScript(URLS.brython.loader);
      if (!scriptWasLoaded) return false;
      createBrythonRunner();
      break;
    }

    default:
      if (window.pythonRunner.debug) log('Could not find ' + engine);
      return false;
  }

  if (window.pythonRunner.debug) {
    log('Successfully loaded ' + engine + '!', 'lime');
  }

  for (let job of window.pythonRunner.loadingEngines[engine]) {
    await job();
  }

  delete window.pythonRunner.loadingEngines[engine];
  window.pythonRunner.options.onLoaded(engine);

  return true;
};

function createPyodideRunner() {
  const engine = 'pyodide';

  const prettyPrint = (arg) => {
    switch (typeof arg) {
      case 'object':
        return JSON.stringify(arg);
      case 'string':
        return arg;
      case 'number':
        return arg;
      default:
        return arg;
    }
  };

  window.pyodide.globals.set('print', (...args) => {
    let sep = ' ';
    let end = '\n';
    if (typeof args[args.length - 1] === 'object') {
      const kwargs = args.pop();
      if ('file' in kwargs) {
        delete kwargs['file'];
      }
      if ('sep' in kwargs) {
        sep = kwargs['sep'];
        delete kwargs['sep'];
        if (sep !== null) {
          if (typeof sep !== 'string') {
            throw new Error('sep must be None or a string');
          }
        }
      }
      if ('end' in kwargs) {
        end = kwargs['end'];
        delete kwargs['end'];
        if (end !== null) {
          if (typeof end !== 'string') {
            throw new Error('end must be None or a string');
          }
        }
      }
      if (Object.keys(kwargs).length) {
        delete kwargs['file'];
        delete kwargs['flush'];
        if (Object.keys(kwargs).length) {
          throw new Error('invalid keyword arguments to print()');
        }
      }
    }
    const content = args.map((arg) => prettyPrint(arg)).join(sep) + end;
    window.pythonRunner.options.output(content);
  });

  window.pythonRunner.loadedEngines[engine] = {
    engine,
    pyodide: window.pyodide,
    predefinedVariables: [],
    variables: {},
    runCode: async (code, options = {}) => {
      try {
        const {
          loadVariablesBeforeRun = window.pythonRunner.options
            .loadVariablesBeforeRun,
          storeVariablesAfterRun = window.pythonRunner.options
            .storeVariablesAfterRun,
          variables = null,
        } = options;

        if (!loadVariablesBeforeRun) {
          await window.pythonRunner.loadedEngines[engine].clearVariables();
        }

        // Add new variables
        if (variables) {
          Object.entries(variables).forEach(([name, value]) => {
            try {
              window.pyodide.globals.set(name, value);
            } catch (ex) {}
          });
        }

        const result = window.pyodide.runPython(code);

        if (storeVariablesAfterRun) {
          window.pythonRunner.loadedEngines[engine].variables = [
            ...window.pyodide.globals.toJs().keys(),
          ]
            .filter(
              (name) =>
                !window.pythonRunner.loadedEngines[
                  engine
                ].predefinedVariables.includes(name)
            )
            .reduce(
              (acc, name) => ({
                ...acc,
                [name]: window.pyodide.globals.get(name),
              }),
              {}
            );
        }
        // Return the result
        return result;
      } catch (ex) {
        if (typeof window.pythonRunner.options.error === 'function') {
          window.pythonRunner.options.error(
            interpretErrorMessage(ex, code, engine)
          );
        } else {
          throw interpretErrorMessage(ex, code, engine);
        }
      }
    },

    getVariable: async (name) => window.pyodide.globals.get(name),

    getVariables: async (
      includeValues = true,
      filter = null,
      onlyShowNewVariables = true
    ) => {
      let variables = [...window.pyodide.globals.toJs().entries()];
      if (onlyShowNewVariables) {
        variables = variables.filter(
          ([name]) =>
            !window.pythonRunner.loadedEngines[
              engine
            ].predefinedVariables.includes(name)
        );
      }
      if (filter) {
        if (typeof filter === 'function') {
          variables = variables.filter(([name]) => filter(name));
        } else {
          if (Array.isArray(filter)) {
            variables = variables.filter(([name]) => filter.includes(name));
          } else {
            variables = variables.filter(([name]) => filter.test(name));
          }
        }
      }
      if (includeValues) {
        return variables.reduce(
          (acc, [name, value]) => ({ ...acc, [name]: value }),
          {}
        );
      }
      return variables.map(([name]) => name);
    },

    setVariable: async (name, value) => {
      try {
        window.pyodide.globals.set(name, value);
      } catch (ex) {}
      window.pythonRunner.loadedEngines[engine].variables[name] = value;
    },

    setVariables: async (variables) => {
      Object.entries(variables).forEach(([name, value]) => {
        try {
          window.pyodide.globals.set(name, value);
        } catch (ex) {}
        window.pythonRunner.loadedEngines[engine].variables[name] = value;
      });
    },

    clearVariable: async (name) => {
      try {
        if (typeof window.pyodide.globals.get(name) !== 'undefined') {
          window.pyodide.globals.delete(name);
        }
      } catch (ex) {}
      if (name in window.pythonRunner.loadedEngines[engine].variables) {
        delete window.pythonRunner.loadedEngines[engine].variables[name];
      }
    },

    clearVariables: async () => {
      for (const name of Object.keys(
        window.pythonRunner.loadedEngines[engine].variables
      )) {
        try {
          if (typeof window.pyodide.globals.get(name) !== 'undefined') {
            window.pyodide.globals.delete(name);
          }
        } catch (ex) {}
      }
      window.pythonRunner.loadedEngines[engine].variables = {};
    },
  };

  window.pythonRunner.loadedEngines[engine].predefinedVariables = [
    ...window.pyodide.globals.toJs().keys(),
  ];
}

function createSkulptRunner() {
  const engine = 'skulpt';

  function builtinRead(x) {
    if (
      window.Sk.builtinFiles === undefined ||
      window.Sk.builtinFiles['files'][x] === undefined
    )
      throw "File not found: '" + x + "'";
    return window.Sk.builtinFiles['files'][x];
  }

  window.pythonRunner.loadedEngines[engine] = {
    engine,
    skulpt: window.Sk,
    predefinedVariables: [],
    variables: {},
    runCode: async (code, options = {}) => {
      const {
        canvas = null,
        loadVariablesBeforeRun = window.pythonRunner.options
          .loadVariablesBeforeRun,
        storeVariablesAfterRun = window.pythonRunner.options
          .storeVariablesAfterRun,
        variables = null,
      } = options;

      if (canvas) {
        (window.Sk.TurtleGraphics || (window.Sk.TurtleGraphics = {})).target =
          canvas;
      }
      try {
        if (loadVariablesBeforeRun) {
          Object.entries(
            window.pythonRunner.loadedEngines[engine].variables
          ).forEach(
            ([name, value]) =>
              (window.Sk.builtins[name] = window.Sk.ffi.remapToPy(value))
          );
        } else {
          await window.pythonRunner.loadedEngines[engine].clearVariables();
        }

        // Add new variables
        if (variables) {
          Object.entries(variables).forEach(
            ([name, value]) =>
              (window.Sk.builtins[name] = window.Sk.ffi.remapToPy(value))
          );
        }

        await new Promise(async (resolve, reject) => {
          window.Sk.configure({
            output: window.pythonRunner.options.output,
            read: builtinRead,
            __future__:
              window.pythonRunner.pythonVersion === 2
                ? window.Sk.python2
                : window.Sk.python3,
          });
          try {
            await window.Sk.importMainWithBody('<stdin>', false, code);
            resolve();
          } catch (err) {
            reject(err.toString());
          }
        });

        if (storeVariablesAfterRun) {
          window.pythonRunner.loadedEngines[engine].variables = {
            ...window.pythonRunner.loadedEngines[engine].variables,
            ...Object.entries(window.Sk.globals)
              .filter(
                ([name]) =>
                  !window.pythonRunner.loadedEngines[
                    engine
                  ].predefinedVariables.includes(name)
              )
              .reduce(
                (acc, [name, value]) => ({
                  ...acc,
                  [name]: value.v,
                }),
                {}
              ),
          };
        }
      } catch (ex) {
        if (typeof window.pythonRunner.options.error === 'function') {
          window.pythonRunner.options.error(
            interpretErrorMessage(ex, code, engine)
          );
        } else {
          throw interpretErrorMessage(ex, code, engine);
        }
      }
    },

    getVariable: async (name) => {
      return window.Sk.ffi.remapToJs(window.Sk.globals[name]);
    },

    getVariables: async (
      includeValues = true,
      filter = null,
      onlyShowNewVariables = true
    ) => {
      if (onlyShowNewVariables && filter === null) {
        if (includeValues) {
          return window.pythonRunner.loadedEngines[engine].variables;
        }
        return Object.keys(window.pythonRunner.loadedEngines[engine].variables);
      } else {
        let variables = Object.entries(window.Sk.globals);
        if (onlyShowNewVariables) {
          variables = variables.filter(
            ([name]) =>
              !window.pythonRunner.loadedEngines[
                engine
              ].predefinedVariables.includes(name)
          );
        }
        if (filter) {
          if (typeof filter === 'function') {
            variables = variables.filter(([name]) => filter(name));
          } else {
            if (Array.isArray(filter)) {
              variables = variables.filter(([name]) => filter.includes(name));
            } else {
              variables = variables.filter(([name]) => filter.test(name));
            }
          }
        }
        if (includeValues) {
          return variables.reduce(
            (acc, [name, value]) => ({ ...acc, [name]: value.v }),
            {}
          );
        }
        return variables.map(([name]) => name);
      }
    },

    setVariable: async (name, value) => {
      window.pythonRunner.loadedEngines[engine].variables[name] = value;
    },

    setVariables: async (variables) => {
      Object.entries(variables).forEach(([name, value]) => {
        window.pythonRunner.loadedEngines[engine].variables[name] = value;
      });
    },

    clearVariable: async (name) => {
      delete window.Sk.builtins[name];
      if (name in window.pythonRunner.loadedEngines[engine].variables) {
        delete window.pythonRunner.loadedEngines[engine].variables[name];
      }
    },

    clearVariables: async () => {
      Object.keys(window.pythonRunner.loadedEngines[engine].variables).forEach(
        (name) => delete window.Sk.builtins[name]
      );
      window.pythonRunner.loadedEngines[engine].variables = {};
    },
  };

  window.pythonRunner.loadedEngines[engine].runCode('1');
  window.pythonRunner.loadedEngines[engine].predefinedVariables = Object.keys(
    window.Sk.globals
  );
}

async function createBrythonRunner() {
  const engine = 'brython';
  await new Promise((resolve) => {
    const runner = new BrythonRunner({
      onInit: () => {
        resolve();
      },
      stdout: {
        write: (arg) => window.pythonRunner.options.output(arg),
        flush() {},
      },
      stderr: {
        write: (ex) => {
          const code = window.pythonRunner.loadedEngines[engine].currentCode;
          if (typeof window.pythonRunner.options.error === 'function') {
            window.pythonRunner.options.error(
              interpretErrorMessage(ex, code, engine)
            );
          } else {
            throw interpretErrorMessage(ex, code, engine);
          }
        },
        flush() {},
      },
      stdin: {
        readline: async () => await window.pythonRunner.options.input,
      },
    });

    window.pythonRunner.loadedEngines[engine] = {
      engine,
      brython: runner,
      predefinedVariables: [],
      variables: {},

      runCode: async (code, options = {}) => {
        const {
          loadVariablesBeforeRun = window.pythonRunner.options
            .loadVariablesBeforeRun,
          storeVariablesAfterRun = window.pythonRunner.options
            .storeVariablesAfterRun,
          variables = null,
        } = options;

        const prependedCode = [];

        if (loadVariablesBeforeRun) {
          Object.entries(
            window.pythonRunner.loadedEngines[engine].variables
          ).forEach(([name, value]) => prependedCode.push(name + '=' + value));
          prependedCode.push('\n');
        } else {
          await window.pythonRunner.loadedEngines[engine].clearVariables();
        }

        // Add new variables
        if (variables) {
          Object.entries(variables).forEach(([name, value]) => {
            try {
              prependedCode.push(name + '=' + value);
            } catch (ex) {}
          });
        }

        window.pythonRunner.loadedEngines[engine].currentCode = code;
        // !Getting variables are really hacky. Should consider using a
        // !non-webworker Brython implementation in the future
        if (storeVariablesAfterRun) {
          const newVariables = {};
          const { output } = getOptions();
          await setOptions({
            output: (...result) => {
              if (result[0].indexOf('vars():') === 0) {
                result[0]
                  .slice(8)
                  .split('\n')
                  .forEach((keyValue) => {
                    const [key, ...valueArr] = keyValue.split(':');
                    if (
                      key &&
                      !window.pythonRunner.loadedEngines[
                        engine
                      ].predefinedVariables.includes(key)
                    ) {
                      const value = valueArr.join(':');
                      switch (value) {
                        case 'inf':
                          newVariables[key] = 'float("inf")';
                          break;
                        case '-inf':
                          newVariables[key] = 'float("-inf")';
                          break;
                        case 'nan':
                          newVariables[key] = 'float("nan")';
                          break;
                        default:
                          if (value.charAt(0) === '<') {
                            newVariables[key] = '"' + value + '"';
                          } else {
                            newVariables[key] = value;
                          }
                          break;
                      }
                    }
                  });
                window.pythonRunner.loadedEngines[engine].variables =
                  newVariables;
              } else {
                output(...result);
              }
            },
          });
          await runner.runCode(
            prependedCode.join(';') +
              code +
              '\nprint("vars():\\n" + "\\n".join([i+":"+("\\""+e+"\\"" if isinstance(e, str) else str(e)) for i,e in vars().items()]))\n'
          );
          await setOptions({ output });
        } else {
          await runner.runCode(code);
        }
      },

      getVariable: async (name) =>
        window.pythonRunner.loadedEngines[engine].variables[name],

      getVariables: async (
        includeValues = true,
        filter = null,
        onlyShowNewVariables = true
      ) => {
        if (includeValues) {
          if (filter) {
            return Object.keys(
              window.pythonRunner.loadedEngines[engine].variables
            )
              .filter(filter)
              .reduce((acc, name) => {
                return {
                  ...acc,
                  [name]:
                    window.pythonRunner.loadedEngines[engine].variables[name],
                };
              }, {});
          }
          return window.pythonRunner.loadedEngines[engine].variables;
        }
        if (filter) {
          return Object.keys(
            window.pythonRunner.loadedEngines[engine].variables
          ).filter(filter);
        }
        return Object.keys(window.pythonRunner.loadedEngines[engine].variables);
      },

      setVariable: async (name, value) => {
        window.pythonRunner.loadedEngines[engine].variables[name] = value;
      },

      setVariables: async (variables) => {
        Object.entries(variables).forEach(([name, value]) => {
          window.pythonRunner.loadedEngines[engine].variables[name] = value;
        });
      },

      clearVariable: async (name) => {
        delete window.pythonRunner.loadedEngines[engine].variables[name];
      },

      clearVariables: async () => {
        window.pythonRunner.loadedEngines[engine].variables = {};
      },
    };

    window.pythonRunner.loadedEngines[engine].predefinedVariables = [
      '__class__',
      '__doc__',
      '__file__',
      '__name__',
      '__package__',
    ];
  });
}

window.pythonRunner.loadEngines = async function (engines) {
  return await Promise.all(engines.map(window.pythonRunner.loadEngine));
};

window.pythonRunner.runCode = async function (code, userOptions = {}) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].runCode(
    code,
    userOptions
  );
};

window.pythonRunner.getVariable = async function (name, userOptions = {}) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].getVariable(
    name
  );
};

window.pythonRunner.getVariables = async function (
  userOptions = {
    includeValues: true,
    filter: null,
    onlyShowNewVariables: true,
  }
) {
  const {
    use: specificEngine = window.pythonRunner.currentEngine,
    includeValues = true,
    filter = null,
    onlyShowNewVariables = true,
  } = userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].getVariables(
    includeValues,
    filter,
    onlyShowNewVariables
  );
};

window.pythonRunner.setVariable = async function (
  name,
  value,
  userOptions = {}
) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].setVariable(
    name,
    value
  );
};

window.pythonRunner.setVariables = async function (
  variables,
  userOptions = {}
) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].setVariables(
    variables
  );
};

window.pythonRunner.clearVariable = async function (name, userOptions = {}) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].clearVariable(
    name
  );
};

window.pythonRunner.clearVariables = async function (userOptions = {}) {
  const { use: specificEngine = window.pythonRunner.currentEngine } =
    userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[
    specificEngine
  ].clearVariables();
};

const pythonRunner = window.pythonRunner;

export const setEngine = pythonRunner.setEngine;
export const loadEngine = pythonRunner.loadEngine;
export const loadEngines = pythonRunner.loadEngines;
export const runCode = pythonRunner.runCode;
export const getOptions = pythonRunner.getOptions;
export const setOptions = pythonRunner.setOptions;

// TODO: Add native options for dealing with variables
export const getVariable = pythonRunner.getVariable;
export const getVariables = pythonRunner.getVariables;
export const setVariable = pythonRunner.setVariable;
export const setVariables = pythonRunner.setVariables;
export const clearVariable = pythonRunner.clearVariable;
export const clearVariables = pythonRunner.clearVariables;

export default pythonRunner;
