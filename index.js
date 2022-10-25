/**
 * @typedef {"skulpt" | "pyodide" | "brython"} Engine
 */
/** @type {Engine} */
const defaultPythonEngine = 'pyodide';

const semverAbove = (version, isAbove, orEqual = true) => {
  const [majorV, minorV, patchV] = version.split('.').map((n) => parseInt(n));
  const [majorA, minorA, patchA] = isAbove.split('.').map((n) => parseInt(n));
  if (majorV > majorA) return true;
  if (majorV === majorA && minorV > minorA) return true;
  if (majorV === majorA && minorV === minorA && patchV > patchA) return true;
  if (orEqual) {
    if (majorV === majorA && minorV === minorA && patchV === patchA)
      return true;
  }
  return false;
};

const engines = {
  pyodide: {
    loader: (version) =>
      semverAbove(version, '0.18.0')
        ? `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.mjs`
        : `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.js`,
    indexURL: (version) => `https://cdn.jsdelivr.net/pyodide/v${version}/full/`,
    versions: ['0.21.3', '0.18.1', '0.18.0', '0.17.0'],
  },
  skulpt: {
    loader: (version) =>
      `https://cdn.jsdelivr.net/npm/skulpt@${version}/dist/skulpt.min.js`,
    library: (version) =>
      `https://cdn.jsdelivr.net/npm/skulpt@${version}/dist/skulpt-stdlib.js`,
    versions: ['latest', '1.2.0', '1.0.0'],
  },
  brython: {
    loader: (version) =>
      `https://cdn.jsdelivr.net/npm/brython-runner@${version}/lib/brython-runner.bundle.js`,
    versions: ['latest', '1.0.10'],
  },
};

/**
 * @typedef {Object} Options
 * @property {(...data) => void=} output The output from Python print()-functions
 * @property {null | (error?: PythonError) => void=} error Parsed Python error messages
 * @property {(message: string, _default?: string) => void=} input Python input()-function
 * @property {number=} pythonVersion
 * @property {boolean=} loadVariablesBeforeRun
 * @property {boolean=} storeVariablesAfterRun
 * @property {(engine: Engine, isFirst: boolean) => void=} onLoading
 * @property {(engine: Engine, isLast: boolean) => void=} onLoaded
 */
const options = {
  output: console.log,
  error: null,
  input: window.prompt,
  pythonVersion: 3,
  loadVariablesBeforeRun: true,
  storeVariablesAfterRun: true,
  onLoading: (engine, isFirst) => {},
  onLoaded: (engine, isLast) => {},
};

/**
 * @typedef {{[name: string]: any}} Variables
 */

/**
 * @typedef {Object} LoadedEngine
 * @property {any} runnerReference
 * @property {string} currentCode
 * @property {string} engine
 * @property {string[]} predefinedVariables
 * @property {runCode} runCode
 * @property {getVariable} getVariable
 * @property {getVariables} getVariables
 * @property {setVariable} setVariable
 * @property {setVariables} setVariables
 * @property {clearVariable} clearVariable
 * @property {clearVariables} clearVariables
 * @property {{[name: string]: any}} variables
 */

/**
 * @typedef {Object} PythonRunner
 * @property {{[engine: Engine]: LoadedEngine}} loadedEngines
 * @property {{[engine: Engine]: (couldNotLoad: boolean) => void}} loadingEngines
 * @property {{[url: string]: boolean}} loadingScripts
 * @property {boolean} debug Turn on logging
 * @property {null | (output: string) => void} debugFunction
 * @property {Engine} currentEngine
 * @property {loadEngine} loadEngine
 * @property {loadEngines} loadEngines
 * @property {setEngine} setEngine
 * @property {hasEngine} hasEngine
 * @property {isLoadingEngine} isLoadingEngine
 * @property {getOptions} getOptions
 * @property {setOptions} setOptions
 * @property {runCode} runCode
 * @property {getVariable} getVariable
 * @property {getVariables} getVariables
 * @property {setVariable} setVariable
 * @property {setVariables} setVariables
 * @property {clearVariable} clearVariable
 * @property {clearVariables} clearVariables
 * @property {Options} options
 */
/** @type {PythonRunner} */
const pythonRunner = {
  loadedEngines: {},
  loadingEngines: {},
  loadingScripts: {},
  debug: false, // Turn on logging of important actions
  debugFunction: null,
  currentEngine: defaultPythonEngine,
  options,
};

const log = function (input, color = '#aaa', style = 'font-weight:bold') {
  console.log('%c' + input, `color:${color};${style}`);
  if (pythonRunner.debugFunction) pythonRunner.debugFunction(input + '\n');
};

/**
 * @function hasEngine
 * @param {Engine} engine
 * @param {string} version
 * @returns {boolean}
 */
export function hasEngine(engine, version) {
  if (version !== null) {
    return engine + '@' + version in pythonRunner.loadedEngines;
  }
  return engine in pythonRunner.loadedEngines;
}

/**
 * @function engineExists
 * @param {Engine} engine
 * @param {string} version
 * @returns {boolean}
 */
export function engineExists(engine, version = null) {
  if (version !== null) {
    return engine in engines && engines[engine].versions.includes(version);
  }
  return engine in engines;
}

/**
 * @function isLoadingEngine
 * @param {Engine} engine
 * @returns {boolean}
 */
function isLoadingEngine(engine) {
  return engine in pythonRunner.loadingEngines;
}

/**
 * @function getOptions
 * @returns {Options}
 */
export function getOptions() {
  return pythonRunner.options;
}

/**
 * @function setOptions
 * @param {Options} options
 */
export function setOptions(options) {
  if ('pythonVersion' in options) {
    if ('skulpt' in pythonRunner.loadedEngines) {
      window.Sk.configure({
        __future__:
          pythonRunner.options.pythonVersion === 2
            ? window.Sk.python2
            : window.Sk.python3,
      });
    }
  }
  pythonRunner.options = { ...pythonRunner.options, ...options };
}

/**
 * @async
 * @function setEngine
 * @param {Engine} engine
 */
export async function setEngine(engine, version = null) {
  if (!hasEngine(engine, version)) {
    await loadEngine(engine, { version });
  }
  pythonRunner.currentEngine = engine;
  if (pythonRunner.debug) log('Using the ' + engine + ' engine', 'orange');
  return true;
}

async function loadScript(url, moduleName = false, timeout = 20000) {
  return new Promise(async (resolve, reject) => {
    if (url in pythonRunner.loadingScripts) {
      resolve(false);
      return;
    }

    pythonRunner.loadingScripts[url] = true;

    const timeoutID = setTimeout(() => {
      pythonRunner.loadingScripts[url] = false;
      reject('Used too much time to load ' + url);
    }, timeout);

    if (moduleName) {
      const script = document.createElement('script');
      script.type = 'module';
      window[moduleName + 'ModuleFinished'] = () => {
        pythonRunner.loadingScripts[url] = false;
        clearTimeout(timeoutID);
        resolve(true);
      };
      script.text = `
      import * as ${moduleName} from "${url}"
      window.${moduleName} = ${moduleName}
      window["${moduleName}ModuleFinished"]()
      `;
      document.head.appendChild(script);
    } else {
      const script = document.createElement('script');
      script.src = url;
      document.head.appendChild(script);

      script.addEventListener('error', () => {
        pythonRunner.loadingScripts[url] = false;
        reject('An error occurred when loading script: ' + url);
      });

      script.addEventListener('load', () => {
        pythonRunner.loadingScripts[url] = false;
        clearTimeout(timeoutID);
        resolve(true);
      });
    }
  });
}

async function untilTheEngineIsLoaded(engine) {
  if (!pythonRunner.loadedEngines[engine]) {
    return await new Promise((resolve, reject) => {
      pythonRunner.loadingEngines[engine].push((couldNotLoad) => {
        if (couldNotLoad) reject();
        else resolve();
      });
    });
  } else {
    return;
  }
}

/**
 * @typedef {Object} PythonError
 * @property {number} columnNumber
 * @property {Engine} engine
 * @property {Error} error
 * @property {string} code
 * @property {(n: number) => string[]} getNLinesAbove
 * @property {(n: number) => string[]} getNLinesBelow
 * @property {string} line
 * @property {number} lineNumber
 * @property {string} message
 * @property {string} type
 */

/**
 * @function interpretErrorMessage
 * @param {any} error
 * @param {string} code
 * @param {string} engine
 * @returns {PythonError}
 */
export function interpretErrorMessage(error, code, engine) {
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

/**
 * @async
 * @function loadEngine
 * @param {Engine} engine
 * @returns {boolean} If engine was loaded (or already loaded)
 * @throws {Error} If engine does not exist
 */
export async function loadEngine(
  engine = pythonRunner.currentEngine,
  { useEngine = false, version = null } = {}
) {
  if (!engineExists(engine, version)) {
    throw new Error(
      'Engine "' +
        engine +
        '" does not exist. Want it to be included? File an issue here: https://github.com/niklasmh/client-side-python-runner/issues'
    );
  }

  if (hasEngine(engine, version)) {
    if (useEngine) pythonRunner.currentEngine = engine;
    return true;
  }

  if (version === null) {
    version = engines[engine].versions[0];
  }

  if (pythonRunner.debug) {
    log('Loading ' + engine + '...');
  }

  if (useEngine) {
    pythonRunner.currentEngine = engine;
  }

  if (isLoadingEngine(engine)) {
    try {
      await untilTheEngineIsLoaded(engine);
      return true;
    } catch (err) {
      return false;
    }
  }

  pythonRunner.loadingEngines[engine] = [];
  pythonRunner.options.onLoading(
    engine,
    Object.keys(pythonRunner.loadingEngines).length === 1
  );

  switch (engine) {
    case 'pyodide': {
      if (semverAbove(version, '0.18.0')) {
        const scriptWasLoaded = await loadScript(
          engines.pyodide.loader(version),
          'pyodideModule'
        );
        if (!scriptWasLoaded)
          throw new Error(
            'Could not reach "' + engines.pyodide.loader(version) + '"'
          );
        window.pyodide = await window.pyodideModule.loadPyodide();
      } else {
        const scriptWasLoaded = await loadScript(
          engines.pyodide.loader(version)
        );
        if (!scriptWasLoaded)
          throw new Error(
            'Could not reach "' + engines.pyodide.loader(version) + '"'
          );
        await window.loadPyodide({
          indexURL: engines.pyodide.indexURL(version),
        });
      }
      pythonRunner.loadedEngines[engine + '@' + version] = true;
      createPyodideRunner();
      break;
    }

    case 'skulpt': {
      const script1WasLoaded = await loadScript(engines.skulpt.loader(version));
      const script2WasLoaded = await loadScript(
        engines.skulpt.library(version)
      );
      if (!script1WasLoaded)
        throw new Error(
          'Could not reach "' + engines.skulpt.loader(version) + '"'
        );
      if (!script2WasLoaded)
        throw new Error(
          'Could not reach "' + engines.skulpt.library(version) + '"'
        );
      pythonRunner.loadedEngines[engine + '@' + version] = true;
      await createSkulptRunner();
      break;
    }

    case 'brython': {
      const scriptWasLoaded = await loadScript(engines.brython.loader(version));
      if (!scriptWasLoaded)
        throw new Error(
          'Could not reach "' + engines.brython.loader(version) + '"'
        );
      pythonRunner.loadedEngines[engine + '@' + version] = true;
      await createBrythonRunner();
      break;
    }

    default:
      if (pythonRunner.debug) log('Could not find ' + engine);
      throw new Error('Could not load "' + engine + '" as it did not exist');
  }

  if (pythonRunner.debug) {
    log('Successfully loaded ' + engine + '!', 'lime');
  }

  for (let job of pythonRunner.loadingEngines[engine]) {
    await job();
  }

  delete pythonRunner.loadingEngines[engine];
  pythonRunner.options.onLoaded(
    engine,
    Object.keys(pythonRunner.loadingEngines).length === 0
  );
  return true;
}

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
    pythonRunner.options.output(content);
  });

  pythonRunner.loadedEngines[engine] = {
    engine,
    runnerReference: window.pyodide,
    predefinedVariables: [],
    variables: {},
    runCode: async (code, options = {}) => {
      try {
        const {
          loadVariablesBeforeRun = pythonRunner.options.loadVariablesBeforeRun,
          storeVariablesAfterRun = pythonRunner.options.storeVariablesAfterRun,
          variables = null,
        } = options;

        if (!loadVariablesBeforeRun) {
          await pythonRunner.loadedEngines[engine].clearVariables();
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
          pythonRunner.loadedEngines[engine].variables = [
            ...window.pyodide.globals.toJs().keys(),
          ]
            .filter(
              (name) =>
                !pythonRunner.loadedEngines[
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
        if (typeof pythonRunner.options.error === 'function') {
          pythonRunner.options.error(interpretErrorMessage(ex, code, engine));
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
            !pythonRunner.loadedEngines[engine].predefinedVariables.includes(
              name
            )
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
      pythonRunner.loadedEngines[engine].variables[name] = value;
    },

    setVariables: async (variables) => {
      Object.entries(variables).forEach(([name, value]) => {
        try {
          window.pyodide.globals.set(name, value);
        } catch (ex) {}
        pythonRunner.loadedEngines[engine].variables[name] = value;
      });
    },

    clearVariable: async (name) => {
      try {
        if (typeof window.pyodide.globals.get(name) !== 'undefined') {
          window.pyodide.globals.delete(name);
        }
      } catch (ex) {}
      if (name in pythonRunner.loadedEngines[engine].variables) {
        delete pythonRunner.loadedEngines[engine].variables[name];
      }
    },

    clearVariables: async () => {
      for (const name of Object.keys(
        pythonRunner.loadedEngines[engine].variables
      )) {
        try {
          if (typeof window.pyodide.globals.get(name) !== 'undefined') {
            window.pyodide.globals.delete(name);
          }
        } catch (ex) {}
      }
      pythonRunner.loadedEngines[engine].variables = {};
    },
  };

  pythonRunner.loadedEngines[engine].predefinedVariables = [
    ...window.pyodide.globals.toJs().keys(),
  ];
}

async function createSkulptRunner() {
  const engine = 'skulpt';

  function builtinRead(filename) {
    if (
      window.Sk.builtinFiles === undefined ||
      window.Sk.builtinFiles['files'][filename] === undefined
    ) {
      throw "File not found: '" + filename + "'";
    }
    return window.Sk.builtinFiles['files'][filename];
  }

  pythonRunner.loadedEngines[engine] = {
    engine,
    runnerReference: window.Sk,
    predefinedVariables: [],
    variables: {},
    runCode: async (code, options = {}) => {
      const {
        turtleGraphics = {},
        loadVariablesBeforeRun = pythonRunner.options.loadVariablesBeforeRun,
        storeVariablesAfterRun = pythonRunner.options.storeVariablesAfterRun,
        variables = null,
      } = options;

      try {
        if (loadVariablesBeforeRun) {
          Object.entries(pythonRunner.loadedEngines[engine].variables).forEach(
            ([name, value]) =>
              (window.Sk.builtins[name] = window.Sk.ffi.remapToPy(value))
          );
        } else {
          await pythonRunner.loadedEngines[engine].clearVariables();
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
            output: pythonRunner.options.output,
            read: builtinRead,
            __future__:
              pythonRunner.pythonVersion === 2
                ? window.Sk.python2
                : window.Sk.python3,
          });

          if (turtleGraphics) {
            if (window.Sk.TurtleGraphics) {
              window.Sk.TurtleGraphics = {
                ...window.Sk.TurtleGraphics,
                ...turtleGraphics,
              };
            } else {
              window.Sk.TurtleGraphics = turtleGraphics;
            }
          }

          try {
            const program = window.Sk.misceval.asyncToPromise(function () {
              return window.Sk.importMainWithBody('<stdin>', false, code, true);
            });
            await program;
            resolve();
          } catch (err) {
            reject(err.toString());
          }
        });

        if (storeVariablesAfterRun) {
          pythonRunner.loadedEngines[engine].variables = {
            ...pythonRunner.loadedEngines[engine].variables,
            ...Object.entries(window.Sk.globals)
              .filter(
                ([name]) =>
                  !pythonRunner.loadedEngines[
                    engine
                  ].predefinedVariables.includes(name)
              )
              .reduce(
                (acc, [name, value]) => ({
                  ...acc,
                  [name]: Sk.ffi.remapToJs(value),
                }),
                {}
              ),
          };
        }
      } catch (ex) {
        if (typeof pythonRunner.options.error === 'function') {
          pythonRunner.options.error(interpretErrorMessage(ex, code, engine));
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
          return pythonRunner.loadedEngines[engine].variables;
        }
        return Object.keys(pythonRunner.loadedEngines[engine].variables);
      } else {
        let variables = Object.entries(window.Sk.globals);
        if (onlyShowNewVariables) {
          variables = variables.filter(
            ([name]) =>
              !pythonRunner.loadedEngines[engine].predefinedVariables.includes(
                name
              )
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
            (acc, [name, value]) => ({
              ...acc,
              [name]: Sk.ffi.remapToJs(value),
            }),
            {}
          );
        }
        return variables.map(([name]) => name);
      }
    },

    setVariable: async (name, value) => {
      pythonRunner.loadedEngines[engine].variables[name] = value;
    },

    setVariables: async (variables) => {
      Object.entries(variables).forEach(([name, value]) => {
        pythonRunner.loadedEngines[engine].variables[name] = value;
      });
    },

    clearVariable: async (name) => {
      delete window.Sk.builtins[name];
      if (name in pythonRunner.loadedEngines[engine].variables) {
        delete pythonRunner.loadedEngines[engine].variables[name];
      }
    },

    clearVariables: async () => {
      Object.keys(pythonRunner.loadedEngines[engine].variables).forEach(
        (name) => delete window.Sk.builtins[name]
      );
      pythonRunner.loadedEngines[engine].variables = {};
    },
  };

  await pythonRunner.loadedEngines[engine].runCode('1');
  pythonRunner.loadedEngines[engine].predefinedVariables = Object.keys(
    window.Sk.globals || {}
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
        write: (arg) => pythonRunner.options.output(arg),
        flush() {},
      },
      stderr: {
        write: (ex) => {
          const code = pythonRunner.loadedEngines[engine].currentCode;
          if (typeof pythonRunner.options.error === 'function') {
            pythonRunner.options.error(interpretErrorMessage(ex, code, engine));
          } else {
            throw interpretErrorMessage(ex, code, engine);
          }
        },
        flush() {},
      },
      stdin: {
        readline: async () => await pythonRunner.options.input,
      },
    });

    pythonRunner.loadedEngines[engine] = {
      engine,
      runnerReference: runner,
      predefinedVariables: [
        '__class__',
        '__doc__',
        '__file__',
        '__name__',
        '__package__',
      ],
      variables: {},

      runCode: async (code, options = {}) => {
        const {
          loadVariablesBeforeRun = pythonRunner.options.loadVariablesBeforeRun,
          storeVariablesAfterRun = pythonRunner.options.storeVariablesAfterRun,
          variables = null,
        } = options;

        const prependedCode = [];

        if (loadVariablesBeforeRun) {
          Object.entries(pythonRunner.loadedEngines[engine].variables).forEach(
            ([name, value]) => prependedCode.push(name + '=' + value)
          );
        } else {
          await pythonRunner.loadedEngines[engine].clearVariables();
        }

        // Add new variables
        if (variables) {
          Object.entries(variables).forEach(([name, value]) => {
            try {
              prependedCode.push(name + '=' + value);
            } catch (ex) {}
          });
        }

        pythonRunner.loadedEngines[engine].currentCode = code;
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
                      !pythonRunner.loadedEngines[
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
                pythonRunner.loadedEngines[engine].variables = newVariables;
              } else {
                output(...result);
              }
            },
          });
          await runner.runCode(
            prependedCode.join(';') +
              '\n' +
              code +
              '\nprint("vars():\\n" + "\\n".join([i+":"+("\\""+e+"\\"" if isinstance(e, str) else str(e)) for i,e in vars().items()]))\n'
          );
          await setOptions({ output });
        } else {
          await runner.runCode(prependedCode.join(';') + '\n' + code);
        }
      },

      getVariable: async (name) =>
        pythonRunner.loadedEngines[engine].variables[name],

      getVariables: async (
        includeValues = true,
        filter = null,
        onlyShowNewVariables = true
      ) => {
        if (includeValues) {
          if (filter) {
            return Object.keys(pythonRunner.loadedEngines[engine].variables)
              .filter(filter)
              .reduce((acc, name) => {
                return {
                  ...acc,
                  [name]: pythonRunner.loadedEngines[engine].variables[name],
                };
              }, {});
          }
          return pythonRunner.loadedEngines[engine].variables;
        }
        if (filter) {
          return Object.keys(
            pythonRunner.loadedEngines[engine].variables
          ).filter(filter);
        }
        return Object.keys(pythonRunner.loadedEngines[engine].variables);
      },

      setVariable: async (name, value) => {
        pythonRunner.loadedEngines[engine].variables[name] = value;
      },

      setVariables: async (variables) => {
        Object.entries(variables).forEach(([name, value]) => {
          pythonRunner.loadedEngines[engine].variables[name] = value;
        });
      },

      clearVariable: async (name) => {
        delete pythonRunner.loadedEngines[engine].variables[name];
      },

      clearVariables: async () => {
        pythonRunner.loadedEngines[engine].variables = {};
      },
    };
  });
}

/**
 * @async
 * @function loadEngines
 * @param {Engine[]} engines
 */
export async function loadEngines(engines) {
  return await Promise.all(engines.map(loadEngine));
}

/**
 * @async
 * @function runCode
 * @param {{use?: Engine}=} userOptions
 * @returns {any=} Last result from pyodide. (Not the other runners)
 * @throws {Error|PythonError} Invalid python engine | A python error
 */
export async function runCode(code, userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine, version = null } =
    userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].runCode(
    code,
    userOptions
  );
}

/**
 * @async
 * @function getVariable
 * @param {{use?: Engine}=} userOptions
 * @returns {any}
 */
export async function getVariable(name, userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine, version = null } =
    userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].getVariable(name);
}

/**
 * @async
 * @function getVariables
 * @param {{use?: Engine, includeValues?: boolean, filter?: null | (name) => boolean, onlyShowNewVariables?: boolean}=} userOptions
 * @returns {Variables|string[]}
 */
export async function getVariables(
  userOptions = {
    includeValues: true,
    filter: null,
    onlyShowNewVariables: true,
  }
) {
  const {
    use: specificEngine = pythonRunner.currentEngine,
    version = null,
    includeValues = true,
    filter = null,
    onlyShowNewVariables = true,
  } = userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].getVariables(
    includeValues,
    filter,
    onlyShowNewVariables
  );
}

/**
 * @async
 * @function setVariable
 * @param {string} name
 * @param {any} value
 * @param {{use?: Engine}=} userOptions
 */
export async function setVariable(name, value, userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine } = userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].setVariable(
    name,
    value
  );
}

/**
 * @async
 * @function setVariables
 * @param {Variables} variables
 * @param {{use?: Engine}=} userOptions
 */
export async function setVariables(variables, userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine } = userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].setVariables(
    variables
  );
}

/**
 * @async
 * @function clearVariable
 * @param {string} name
 * @param {{use?: Engine}=} userOptions
 */
export async function clearVariable(name, userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine } = userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].clearVariable(name);
}

/**
 * @async
 * @function clearVariables
 * @param {{use?: Engine}=} userOptions
 */
export async function clearVariables(userOptions = {}) {
  const { use: specificEngine = pythonRunner.currentEngine } = userOptions;

  if (!hasEngine(specificEngine, version))
    await loadEngine(specificEngine, { version });

  return await pythonRunner.loadedEngines[specificEngine].clearVariables();
}

pythonRunner.setEngine = setEngine;
pythonRunner.loadEngine = loadEngine;
pythonRunner.loadEngines = loadEngines;
pythonRunner.runCode = runCode;
pythonRunner.getOptions = getOptions;
pythonRunner.setOptions = setOptions;
pythonRunner.getVariable = getVariable;
pythonRunner.getVariables = getVariables;
pythonRunner.setVariable = setVariable;
pythonRunner.setVariables = setVariables;
pythonRunner.clearVariable = clearVariable;
pythonRunner.clearVariables = clearVariables;

window.pythonRunner = pythonRunner;

export default pythonRunner;
