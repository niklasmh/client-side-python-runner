import pythonRunner from '../../index.js';

//pythonRunner.loadEngine('pyodide');
//pythonRunner.useEngine('pyodide');
/** /
pythonRunner.setOptions({
  output: console.log,
  input: prompt,
});
/**/
pythonRunner.runCode('print("pyodide")');
pythonRunner.runCode('print("skulpt")', { use: 'skulpt' });
