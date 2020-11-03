import pythonRunner, { runCode, setOptions } from '../../index.js';

//pythonRunner.loadEngine('pyodide');
//pythonRunner.useEngine('pyodide');
pythonRunner.debug = true;

setOptions({
  output: (arg) => {
    document.getElementById('output').innerText += arg;
  },
  input: prompt,
});

Promise.all([
  runCode('print("pyodide!!!")'),
  runCode('print("skulpt!!!")', { use: 'skulpt' }),
]);
