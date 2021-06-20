import pythonRunner, {
  loadEngines,
  runCode,
  setOptions,
  setEngine,
} from 'https://cdn.jsdelivr.net/npm/client-side-python-runner@latest';
// Use this to get local changes if contributing:
//} from 'http://localhost:5000/index.js';

pythonRunner.debug = true;

let input;
let code;
let i = 0;
const setOutput = (arg = '') =>
  (document.getElementById('output-' + i).innerHTML += arg);
const setInput = (arg = '') =>
  (document.getElementById('input-' + i).innerHTML = arg);
const setError = (arg = '') =>
  (document.getElementById('error-' + i).innerHTML =
    arg && JSON.stringify(arg, null, 2));

function getCode() {
  return monaco.editor.getModels()[0].getValue();
}

window.runSkulptCode = () => {
  i = 0;
  document.getElementById('output-0').innerHTML = '';
  document.getElementById('error-0').innerHTML = '';
  setOptions({
    error: (arg) => {
      setError(arg);
      console.error(arg);
    },
    output: (arg) => {
      setOutput(arg);
      console.log(arg);
    },
  });
  runCode(getCode(), { use: 'skulpt' });
};

window.runPyodideCode = () => {
  i = 0;
  document.getElementById('output-0').innerHTML = '';
  document.getElementById('error-0').innerHTML = '';
  setOptions({
    error: (arg) => {
      setError(arg);
      console.error(arg);
    },
    output: (arg) => {
      setOutput(arg);
      console.log(arg);
    },
  });
  runCode(getCode(), { use: 'pyodide' });
};

window.clearOutput = () => {
  i = 0;
  document.getElementById('error-0').innerHTML = '';
  document.getElementById('output-0').innerHTML = '';
};

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
  code = `await runCode(\`${input}\`).then(console.log);`;
  setInput(code);
  await runCode(input).then(console.log);

  i++;
  setOptions({ output: (arg) => setOutput(arg) });
  input = 'print("printed from skulpt")';
  code = `await runCode(\`${input}\`, { use: 'skulpt' });`;
  setInput(code);
  await runCode(input, { use: 'skulpt' });

  // Error (pyodide)

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `assert 1 == 2, "This is the feedback"`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `def f(): f()
f()`;
  code = `await runCode(\`${input}\`);`;
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
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `a +`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), storeVariablesAfterRun: true });
  input = `transfer_this = "test"
print("Should store 'transfer_this' to the next execution")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), loadVariablesBeforeRun: true });
  input = `if transfer_this == "test": print("'transfer_this' exists and is set to 'test', as expected")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), loadVariablesBeforeRun: false });
  input = `try:
  transfer_this
except NameError:
  raise Exception("'transfer_this' did not exist, as expected")
else:
  raise Exception("'transfer_this' exists, which is UNEXPECTED!")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  // Error (skulpt)
  setEngine('skulpt');
  i = 100;

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `assert 1 == 2, "This is the feedback"`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `def f(): f()
f()`;
  code = `await runCode(\`${input}\`);`;
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
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg) });
  input = `a +`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), storeVariablesAfterRun: true });
  input = `transfer_this = "test"
print("Should store 'transfer_this' to the next execution")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), loadVariablesBeforeRun: true });
  input = `if transfer_this == "test": print("'transfer_this' exists and is set to 'test', as expected")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);

  i++;
  setOptions({ error: (arg) => setError(arg), loadVariablesBeforeRun: false });
  input = `try:
  transfer_this
except NameError:
  raise Exception("'transfer_this' did not exist, as expected")
else:
  raise Exception("'transfer_this' exists, which is UNEXPECTED!")`;
  code = `await runCode(\`${input}\`);`;
  setInput(code);
  await runCode(input);
})();
