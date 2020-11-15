import pythonRunner, {
  loadEngines,
  runCode,
  setOptions,
  useEngine,
} from '../index.js';

pythonRunner.debug = true;

let input;
let code;
let i = 0;
const setOutput = (arg) =>
  (document.getElementById('output-' + i).innerText += arg);
const setInput = (arg) =>
  (document.getElementById('input-' + i).innerText = arg);
const setError = (arg) =>
  (document.getElementById('error-' + i).innerText = JSON.stringify(
    arg,
    null,
    2
  ));

(async function () {
  i++;
  pythonRunner.debugFunction = (arg) => setOutput(arg);
  code = `await loadEngines(['skulpt', 'pyodide'])`;
  setInput(code);
  await loadEngines(['skulpt', 'pyodide']);
  pythonRunner.debugFunction = null;

  i++;
  setOptions({ output: (arg) => setOutput(arg) });
  input = `print("printed from pyodide");1337`;
  code = `await runCode('${input}').then(console.log);`;
  setInput(code);
  await runCode(input).then(console.log);

  i++;
  setOptions({ output: (arg) => setOutput(arg) });
  input = 'print("printed from skulpt")';
  code = `await runCode('${input}', { use: 'skulpt' });`;
  setInput(code);
  await runCode(input, { use: 'skulpt' });

  // Error (pyodide)

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `assert 1 == 2, "This is the feedback"`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `def f(): f()
f()`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `i=1
f = 3.0**i
for i in range(100):
  print(i, f)
  f = f ** 2
`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `a +`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  // Error (skulpt)
  useEngine('skulpt');

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `assert 1 == 2, "This is the feedback"`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `def f(): f()
f()`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `i=1
f = 3.0**i
for i in range(100):
  print(i, f)
  f = f ** 2
`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `a +`;
  code = `await runCode('${input}');`;
  setInput(code);
  await runCode(input);
})();
