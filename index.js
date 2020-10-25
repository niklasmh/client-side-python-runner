const defaultPythonEngine = 'pyodide';
const log = function (input, color = '#aaa', style = 'font-weight:bold') {
  console.log('%c' + input, `color:${color};${style}`);
};

window.pythonRunner = window.pythonRunner || {
  loadedEngines: {},
  loadingScripts: {},
  debug: true,
  currentEngine: defaultPythonEngine,
};

window.pythonRunner.hasEngine = function (engine) {
  return engine in window.pythonRunner.loadedEngines;
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

      window.pythonRunner.loadedEngines[engine] = {
        engine,
        runCode: (code, options = {}) => {
          return window.pyodide.runPython(code);
        },
      };
      if (window.pythonRunner.debug)
        log('Successfully loaded ' + engine + '!', 'lime');
      return window.pythonRunner.loadedEngines[engine];

    case 'skulpt':
      // Load and stuff
      window.pythonRunner.loadedEngines[engine] = {
        engine,
        runCode: (code, options = {}) => {
          //skulpt.runCode(code);
          return 'Placeholder for the actual skulpt result';
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
