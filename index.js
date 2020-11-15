const defaultPythonEngine = 'pyodide';

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

window.pythonRunner.useEngine = async function (engine) {
  if (!window.pythonRunner.hasEngine(engine)) {
    if (!(await window.pythonRunner.loadEngine(engine))) {
      return false;
    }
  }
  window.pythonRunner.currentEngine = engine;
  if (window.pythonRunner.debug)
    log('Using ' + engine + ' unless other is specified', 'orange');
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

function interperetErrorMessage(error, code, engine) {
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
  }

  return {
    columnNumber,
    engine,
    error,
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

window.pythonRunner.loadEngine = async function (engine) {
  if (window.pythonRunner.debug) log('Loading ' + engine + '...');
  if (window.pythonRunner.hasEngine(engine)) return true;
  if (window.pythonRunner.isLoadingEngine(engine)) {
    try {
      await untilTheEngineIsLoaded(engine);
      return true;
    } catch (err) {
      return false;
    }
  }

  switch (engine) {
    case 'pyodide':
      window.pythonRunner.loadingEngines.pyodide = [];
      const scriptWasLoaded = await loadScript(
        'https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js'
      );

      if (!scriptWasLoaded) return false;

      await window.languagePluginLoader;

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

      window.pyodide.globals.print = (...args) => {
        const kwargs = args.pop();
        let sep = ' ';
        let end = '\n';
        if (typeof kwargs === 'object') {
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
            throw new Error('invalid keyword arguments to print()');
          }
        }
        const content = args.map((arg) => prettyPrint(arg)).join(sep) + end;
        window.pythonRunner.options.output(content);
      };

      window.pythonRunner.loadedEngines[engine] = {
        engine,
        pyodide: window.pyodide,
        runCode: async (code, options = {}) => {
          try {
            return window.pyodide.runPython(code);
          } catch (ex) {
            if (typeof window.pythonRunner.options.error === 'function') {
              window.pythonRunner.options.error(
                interperetErrorMessage(ex, code, engine)
              );
            } else {
              throw interperetErrorMessage(ex, code, engine);
            }
          }
        },
      };
      if (window.pythonRunner.debug)
        log('Successfully loaded ' + engine + '!', 'lime');
      for (let job of window.pythonRunner.loadingEngines[engine]) {
        await job();
      }
      delete window.pythonRunner.loadingEngines[engine];
      return true;
    case 'skulpt':
      window.pythonRunner.loadingEngines.skulpt = [];
      const script1WasLoaded = await loadScript(
        'http://www.skulpt.org/js/skulpt.min.js'
      );
      const script2WasLoaded = await loadScript(
        'http://www.skulpt.org/js/skulpt-stdlib.js'
      );

      if (!script1WasLoaded || !script2WasLoaded) return false;

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
        runCode: async (code, options = {}) => {
          if (options.canvas) {
            (
              window.Sk.TurtleGraphics || (window.Sk.TurtleGraphics = {})
            ).target = options.canvas;
          }
          try {
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
          } catch (ex) {
            if (typeof window.pythonRunner.options.error === 'function') {
              window.pythonRunner.options.error(
                interperetErrorMessage(ex, code, engine)
              );
            } else {
              throw interperetErrorMessage(ex, code, engine);
            }
          }
          // Should not return anything
        },
      };
      if (window.pythonRunner.debug)
        log('Successfully loaded ' + engine + '!', 'lime');
      for (let job of window.pythonRunner.loadingEngines[engine]) {
        await job();
      }
      delete window.pythonRunner.loadingEngines[engine];
      return true;

    default:
      if (window.pythonRunner.debug) log('Could not find ' + engine);
      return false;
  }
};

window.pythonRunner.loadEngines = async function (engines) {
  return await Promise.all(engines.map(window.pythonRunner.loadEngine));
};

window.pythonRunner.runCode = async function (code, userOptions = {}) {
  const {
    use: specificEngine = window.pythonRunner.currentEngine,
  } = userOptions;

  if (!window.pythonRunner.hasEngine(specificEngine)) {
    const didLoad = await window.pythonRunner.loadEngine(specificEngine);
    if (!didLoad) {
      throw new Error('Could not find the ' + specificEngine + ' engine');
    }
  }

  return await window.pythonRunner.loadedEngines[specificEngine].runCode(code);
};

const pythonRunner = window.pythonRunner;

export const useEngine = pythonRunner.useEngine;
export const loadEngine = pythonRunner.loadEngine;
export const runCode = pythonRunner.runCode;
export const setOptions = pythonRunner.setOptions;

export default pythonRunner;
