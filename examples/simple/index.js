import pythonRunner from '../../index.js';

//pythonRunner.loadEngine('pyodide');
//pythonRunner.useEngine('pyodide');
pythonRunner.runCode('print(42)').then(console.log);
pythonRunner.runCode('print(42)', { use: 'skulpt' }).then(console.log);
