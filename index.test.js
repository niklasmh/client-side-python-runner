import { interpretErrorMessage, loadEngine, runCode, setEngine } from './index';

test('interpret skulpt error', () => {
  const message = interpretErrorMessage(
    `NameError: name 'undefinedvariable' is not defined on line 1`,
    'undefinedvariable',
    'skulpt'
  );
  expect(message.code).toBe('undefinedvariable');
  expect(message.columnNumber).toBe(null);
  expect(message.engine).toBe('skulpt');
  expect(message.error).toBe(
    "NameError: name 'undefinedvariable' is not defined on line 1"
  );
  expect(typeof message.getNLinesAbove).toBe('function');
  expect(typeof message.getNLinesBelow).toBe('function');
  expect(message.line).toBe('undefinedvariable');
  expect(message.lineNumber).toBe(1);
  expect(message.message).toBe("name 'undefinedvariable' is not defined");
  expect(message.type).toBe('NameError');
});

test('interpret pyodide error', () => {
  const message = interpretErrorMessage(
    {
      message: `Traceback (most recent call last):
  File "/lib/python3.8/site-packages/pyodide/_base.py", line 344, in eval_code
    return CodeRunner(
  File "/lib/python3.8/site-packages/pyodide/_base.py", line 242, in run
    return eval(last_expr, self.globals, self.locals)
  File "<exec>", line 1, in <module>
NameError: name 'undefinedvariable' is not defined
`,
    },
    'undefinedvariable',
    'pyodide'
  );
  expect(message.code).toBe('undefinedvariable');
  expect(message.columnNumber).toBe(null);
  expect(message.engine).toBe('pyodide');
  expect(message.error.message).toBe(
    `Traceback (most recent call last):
  File "/lib/python3.8/site-packages/pyodide/_base.py", line 344, in eval_code
    return CodeRunner(
  File "/lib/python3.8/site-packages/pyodide/_base.py", line 242, in run
    return eval(last_expr, self.globals, self.locals)
  File "<exec>", line 1, in <module>
NameError: name 'undefinedvariable' is not defined
`
  );
  expect(typeof message.getNLinesAbove).toBe('function');
  expect(typeof message.getNLinesBelow).toBe('function');
  expect(message.line).toBe('undefinedvariable');
  expect(message.lineNumber).toBe(1);
  expect(message.message).toBe("name 'undefinedvariable' is not defined");
  expect(message.type).toBe('NameError');
});

test('interpret brython error', () => {
  const message = interpretErrorMessage(
    `Traceback (most recent call last):
  File ./main.py line 1, in <module>
    undefinedvariable
NameError: name 'undefinedvariable' is not defined`,
    'undefinedvariable',
    'brython'
  );
  expect(message.code).toBe('undefinedvariable');
  expect(message.columnNumber).toBe(null);
  expect(message.engine).toBe('brython');
  expect(message.error).toBe(
    `Traceback (most recent call last):
  File ./main.py line 1, in <module>
    undefinedvariable
NameError: name 'undefinedvariable' is not defined`
  );
  expect(typeof message.getNLinesAbove).toBe('function');
  expect(typeof message.getNLinesBelow).toBe('function');
  expect(message.line).toBe('undefinedvariable');
  expect(message.lineNumber).toBe(1);
  expect(message.message).toBe("name 'undefinedvariable' is not defined");
  expect(message.type).toBe('NameError');
});

test('loadEngine on invalid engine should throw an error', () => {
  return expect(loadEngine('invalid')).rejects.toThrowError();
});

test('setEngine on invalid engine should throw an error', () => {
  return expect(setEngine('invalid')).rejects.toThrowError();
});

test('runCode on invalid engine should throw an error', () => {
  return expect(runCode('a=1', { use: 'invalid' })).rejects.toThrowError();
});
