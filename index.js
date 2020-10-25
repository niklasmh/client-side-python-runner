const defaultPythonEngine = 'pyodide';
const log = function (input, color = '#aaa', style = 'font-weight:bold') {
  console.log('%c' + input, `color:${color};${style}`);
};

window.pythonRunner = window.pythonRunner || {
  loadedEngines: {},
  loadingScripts: {},
  debug: true,
  currentEngine: defaultPythonEngine,
  options: {
    output: console.log,
    error: console.error,
    input: window.prompt,
  },
};

window.pythonRunner.hasEngine = function (engine) {
  return engine in window.pythonRunner.loadedEngines;
};

window.pythonRunner.setOptions = function (options) {
  window.pythonRunner.options = { ...window.pythonRunner.options, options };
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

window.pythonRunner.loadEngine = async function (engine) {
  if (window.pythonRunner.debug) log('Loading ' + engine + '...');
  if (window.pythonRunner.hasEngine(engine)) return null;

  switch (engine) {
    case 'pyodide':
      const scriptWasLoaded = await loadScript(
        'https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js'
      );

      if (!scriptWasLoaded) return null;

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
          return window.pyodide.runPython(code);
        },
      };
      if (window.pythonRunner.debug)
        log('Successfully loaded ' + engine + '!', 'lime');
      return window.pythonRunner.loadedEngines[engine];

    case 'skulpt':
      const script1WasLoaded = await loadScript(
        'http://www.skulpt.org/js/skulpt.min.js'
      );
      const script2WasLoaded = await loadScript(
        'http://www.skulpt.org/js/skulpt-stdlib.js'
      );

      if (!script1WasLoaded || !script2WasLoaded) return null;

      function builtinRead(x) {
        if (
          window.Sk.builtinFiles === undefined ||
          window.Sk.builtinFiles['files'][x] === undefined
        )
          throw "File not found: '" + x + "'";
        return window.Sk.builtinFiles['files'][x];
      }
      var mypre = document.getElementById('output');
      mypre.innerHTML = '';
      window.Sk.pre = 'output';

      window.pythonRunner.loadedEngines[engine] = {
        engine,
        skulpt: window.Sk,
        runCode: async (code, options = {}) => {
          if (options.canvas) {
            (
              window.Sk.TurtleGraphics || (window.Sk.TurtleGraphics = {})
            ).target = options.canvas;
          }
          return await new Promise(async (resolve, reject) => {
            window.Sk.configure({
              output: window.pythonRunner.options.output,
              read: builtinRead,
            });
            try {
              await window.Sk.importMainWithBody('<stdin>', false, code);
              resolve();
            } catch (err) {
              reject(err.toString());
            }
          });
        },
      };
      if (window.pythonRunner.debug)
        log('Successfully loaded ' + engine + '!', 'lime');
      return window.pythonRunner.loadedEngines[engine];

    default:
      if (window.pythonRunner.debug) log('Could not load ' + engine);
      return null;
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

export default pythonRunner;
