import pythonRunner, {
  loadEngines,
  runCode,
  setOptions,
  setEngine,
} from 'https://cdn.jsdelivr.net/npm/client-side-python-runner@latest';

pythonRunner.debug = true;

let input;
let code;
let i = 0;
const setOutput = (arg = '') =>
  (document.getElementById('output-' + i).innerText += arg);
const setInput = (arg = '') =>
  (document.getElementById('input-' + i).innerText = arg);
const setError = (arg = '') =>
  (document.getElementById('error-' + i).innerText =
    arg && JSON.stringify(arg, null, 2));

window.runSkulptCode = () => {
  i = 0;
  document.getElementById('output-0').innerText = '';
  document.getElementById('error-0').innerText = '';
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
  runCode(document.getElementById('code').value, { use: 'skulpt' });
};

window.runPyodideCode = () => {
  i = 0;
  document.getElementById('output-0').innerText = '';
  document.getElementById('error-0').innerText = '';
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
  runCode(document.getElementById('code').value, { use: 'pyodide' });
};

window.clearOutput = () => {
  i = 0;
  document.getElementById('error-0').innerText = '';
  document.getElementById('output-0').innerText = '';
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

  // Error (skulpt)
  setEngine('skulpt');

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
})();
