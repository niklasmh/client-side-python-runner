# Client-side Python runner

Supported python runners so far: [Pyodide][pyodide], [Skulpt][skulpt], [Brython][brython].

Try it out [here](https://niklasmh.github.io/client-side-python-runner/).

```bash
npm i client-side-python-runner --save
# OR
yarn add client-side-python-runner
```

## Usage

Basic example:

```javascript
import { runCode, setEngine, setOptions } from 'client-side-python-runner';
// OR import { runCode, setEngine, setOptions } from 'https://cdn.jsdelivr.net/npm/client-side-python-runner@latest';

setOptions({ output: console.log });

await setEngine('pyodide'); // Specify "skulpt", "pyodide" or "brython"
await runCode(`print("printed from pyodide")`);
// You can now see the print output in the browser console
```

Setting options:

```javascript
import { setOptions } from 'client-side-python-runner';

setOptions({
  output: console.log, // Output from print(...)-functions
  error: null, // Throws an exception unless this is set to a function
  input: prompt, // How to feed the input(...)-function
  pythonVersion: 3, // Preferred version
  loadVariablesBeforeRun: true,
  storeVariablesAfterRun: true,
  onLoading: (engine, isFirst) => {},
  onLoaded: (engine, isLast) => {},
});
```

Handle variables:

```javascript
import {
  runCode,
  getVariables,
  setVariable,
  clearVariables,
} from 'client-side-python-runner';

console.log(await getVariables()); // => {}
await setVariable('test', 123);
console.log(await getVariables()); // => { "test": 123 }

// This will now be used in the next execution:
await runCode(`print(test)`);
// Output in console.log:
// > 123

// Clear all variables:
await clearVariables();
console.log(await getVariables()); // => {}
await runCode(`print(test)`); // Will now result in NameError ("test" is not defined)
```

<details>
<summary>Advanced example</summary>

This will probably be more advanced in the future.

```javascript
import {
  loadEngines,
  loadEngine,
  setEngine,
  setOptions,
  runCode,
} from 'client-side-python-runner';

// Load engines on beforehand
await loadEngines(['pyodide', 'skulpt']);
// OR
await loadEngine('pyodide', { version: '0.17.0' }); // Set engine version
await loadEngine('skulpt');

// Set current engine
await setEngine('skulpt');

// Load engine AND set current engine
await loadEngine('skulpt', { useEngine: true });

// Set options (this will merge with existing options)
setOptions({
  // This represents the values returned from the print
  // function in Python.
  output: (arg) => console.log(arg),

  // Some engines can stop and wait for input, others
  // cannot. To be safe, prompt is the default as it
  // stops JavaScript altogether and therefore works on
  // all cases.
  input: (question) => prompt(question),

  // Here you can opt into getting interpreted error
  // feedback with line numbers and error types or just
  // attempt to interpret these errors yourself.
  error: (err) => console.error(err.lineNumber, err.error),

  // Version 3 is default, unless it is not possible
  // using the current engine
  pythonVersion: 3,

  // Should load the previous stored variables into the
  // python environment. Does not load from other python
  // runners. They all have separate variables currently.
  loadVariablesBeforeRun: true,

  // Make sure the package stores the variables after
  // each run. This should only be done when necessary.
  // It may be set to false by default in the future.
  storeVariablesAfterRun: true,
});

// Run the code (and specifying engine)
await runCode('print("printed from skulpt")', { use: 'skulpt' });

// Switch engine
await setEngine('pyodide');

// Run the code again, but in pyodide (which also can
// return the result from the last execution)
const pyodideResult = await runCode(`
a = 1200
b = 137
print("printed from pyodide")
"this is the returned value " + str(a + b)
`);
// 'pyodideResult' now:
// > "this is the returned value 1337"
```

</details>

## Using it as a loader only

If you want all the control - but not want to deal with loading of necessary scripts, it is possible to just use the loader:

```javascript
import { loadEngine } from 'client-side-python-runner';

await loadEngine('pyodide');

// You can specify engine version like this
await loadEngine('pyodide', { version: '0.23.4' });

// After this, the window.pyodide is ready
window.pyodide.runPython("print('I am using pyodide directly instead')");
```

## Table of Contents

- [Client-side Python runner](#client-side-python-runner)
  - [Usage](#usage)
  - [Using it as a loader only](#using-it-as-a-loader-only)
  - [Table of Contents](#table-of-contents)
  - [API](#api)
    - [`async loadEngine`](#async-loadengine)
    - [`async loadEngines`](#async-loadengines)
    - [`async setEngine`](#async-setengine)
    - [`async runCode`](#async-runcode)
    - [`getOptions`](#getoptions)
    - [`setOptions`](#setoptions)
    - [`async getVariable`](#async-getvariable)
    - [`async getVariables`](#async-getvariables)
    - [`async setVariable`](#async-setvariable)
    - [`async setVariables`](#async-setvariables)
    - [`async clearVariable`](#async-clearvariable)
    - [`async clearVariables`](#async-clearvariables)
  - [Why I made this package](#why-i-made-this-package)
  - [Map of different Python runners](#map-of-different-python-runners)
  - [Versions](#versions)
  - [Later](#later)
  - [Contribute](#contribute)

## API

List of all exported functions:

### `async loadEngine`

Load an engine.

```typescript
async function loadEngine(
  engine: string,
  options = {
    useEngine = true as boolean,
    version = null as string,
  }
);
```

### `async loadEngines`

Load multiple engines. Waits until all of them are loaded.

```typescript
async function loadEngines(engines: string[]);
```

### `async setEngine`

Set the current engine and engine version.

```typescript
async function setEngine(engine: string, version: string = null);
```

### `async runCode`

Run Python code using the current engine (or default if not set). This function will also return the result of the last line if possible (e.g. if 'pyodide' is the current engine).

```typescript
async function runCode(
  code: string,
  options = {
    variables = {} as { [name: string]: any },
    version = null as string,
    loadVariablesBeforeRun = true as boolean,
    storeVariablesAfterRun = true as boolean,
    use = currentEngine as string,
  }
);
```

### `getOptions`

Get all options.

### `setOptions`

Set options. This will go in effect immediately.

```typescript
function setOptions({
  output = console.log as (...data: any[]) => void,
  error = null as (error?: Error | undefined) => void | null,
  input = window.prompt as (message: string, _default?: string) => string,
  pythonVersion = 3 as number, // Preferred version
  loadVariablesBeforeRun = true as boolean,
  storeVariablesAfterRun = true as boolean,
  onLoading = () => {} as (engine: string) => void,
  onLoaded = () => {} as (engine: string) => void,
});
```

### `async getVariable`

```typescript
async function getVariable(
  name: string,
  options = {
    use = currentEngine as string,
    version = null as string,
  }
);
```

### `async getVariables`

```typescript
async function getVariables(
  options = {
    use = currentEngine as string,
    includeValues = true as boolean,
    filter = null as ((name: string) => boolean) | array | RegExp | null,
    onlyShowNewVariables = true as boolean,
  }
);
```

### `async setVariable`

```typescript
async function setVariable(
  name: string,
  value: any,
  options = {
    use = currentEngine as string,
    version = null as string,
  }
);
```

### `async setVariables`

```typescript
async function setVariables(
  variables: {
    [name: string]: any;
  },
  options = {
    use = currentEngine as string,
    version = null as string,
  }
);
```

### `async clearVariable`

```typescript
async function clearVariable(
  name: string,
  options = {
    use = currentEngine as string,
    version = null as string,
  }
);
```

### `async clearVariables`

```typescript
async function clearVariables(
  options = {
    use = currentEngine as string,
    version = null as string,
  }
);
```

## Why I made this package

There are a lot of client-side Python runners out there, and they all have [benefits and disadvantages](https://stromberg.dnsalias.org/~strombrg/pybrowser/python-browser.html). Some can take a lot of loading time, and others are missing libraries you need (e.g. `numpy`) as well as core functionality (e.g. `time.sleep`). This package joins a few of the alternatives giving you the freedom to easily choose what you want in your project right now - without having to do major changes in your code. It also allows for using multiple interpreters at the same time!

Another benefit with using this library is that it can adapt to new Python runners that comes along. The world has just started with exploring the capabilities with Web Assembly (WASM) meaning there will potentially come more optimal solutions out there soon. However, so far, Pyodide has done a pretty thorough job with this, but other engines like Skulpt (not WASM) still loads much faster which - depending on your project - could be an essential factor.

## Map of different Python runners

The choices below are highly inspired by [this article](https://yasoob.me/2019/05/22/running-python-in-the-browser/) and consists of currently working client-side Python runners. When denoting **client-side** Python runners, it means that the Python code is compiled and executed on the client side; not having to send the code to a server and return the result back to the client in form of compiled code or the actual result from the execution. This makes your project not dependent on servers (this is big!) and not prune to security issues as you only work in the browser sandbox.

_DISCLAIMER: The numbers in the table are not scientifically calculated, thus they have been ran on the same machine multiple times and measured using the same tool (Chrome DevTools with cache disabled)._

| Python runner             | Python 3 | Python 2 | Computation\*              | Loading time | Memory   | Packages                                 |
| ------------------------- | -------- | -------- | -------------------------- | ------------ | -------- | ---------------------------------------- |
| [Pyodide 0.21.3][pyodide] | ✔        |          | Very fast (0.259s - WASM)  | ~800ms       | ~6800kB  | [Most scientific libraries][pyodide-lib] |
| [PyPy.js][pypyjs]         |          | ✔        | Very fast (0.034s - JS)    | ~1900ms      | ~15000kB | Browser                                  |
| [Skulpt][skulpt]          | ✔        | ✔        | Fast (1.329s - JS)         | ~150ms       | ~227kB   | TurtleGraphics                           |
| [Brython][brython]        | ✔        |          | Slow (3.445s - JS)         | ~200ms       | ~184kB   | Browser                                  |
| [RustPython][rustpython]  | ✔        |          | Very slow (11.567s - WASM) | ~200ms       | ~184kB   | Browser                                  |

[pyodide]: https://github.com/iodide-project/pyodide
[pyodide-t]: https://alpha.iodide.io/notebooks/300/
[pyodide-lib]: https://github.com/iodide-project/pyodide/tree/master/packages
[skulpt]: https://skulpt.org/
[skulpt-t]: https://skulpt.org/
[brython]: https://brython.info/
[brython-t]: https://brython.info/tests/editor.html
[rustpython]: https://brython.info/
[rustpython-t]: https://rustpython.github.io/demo/
[pypyjs]: https://github.com/pypyjs/pypyjs
[pypyjs-t]: http://pypyjs.org/editor.html
[pyjs]: http://pyjs.org/
[transcrypt]: https://www.transcrypt.org/
[batavia]: https://github.com/beeware/batavia
[pysimplegui]: https://pysimplegui.readthedocs.io/en/latest/

\* Simple benchmark test:

```python
from datetime import datetime

def f(a):
  t_start = float(str(datetime.now()).split(":")[-1]) # Start time
  for i in range(a*10):
    if i % a == 0: print(i)
  t_end = float(str(datetime.now()).split(":")[-1]) # End time
  print("Time used: {:.3f}s".format(t_end - t_start))

f(100000)
```

## Versions

Check out the [`CHANGELOG.md`](./CHANGELOG.md).

## Later

- [ ] Make it possible to run them offline (by building them into the project somehow).
- [ ] Add portals between JavaScript and Python. Useful for executing functions outside the Python scope and the other way around (if possible).

## Contribute

If you find any bugs or have any requests, feel free to file an issue [here](https://github.com/niklasmh/client-side-python-runner/issues). I am more than willing to take your requests into consideration such that this module can be used by more people.

You are also welcome to contribute with code as well, just fork the project, do your magic, then create a PR. It may be that I will do some changes on your changes, it will depend, but if the contribution is really useful - it will be included somehow!

To test out the project - such that you do not need to set up an environment for yourself - you can run:

```bash
npm run develop
npm run examples
npm run done # When done with contribution
```

Then go to [localhost:5000/docs/](http://localhost:5000/docs/) to test it out.

When done, we need to change the import URL in the demo (because it is hosted on GitHub :/):

```
npm run done
```

To generate types (from JSDoc comments in `index.js`):

```
npm run build
```

Check if tests still are working before creating PR:

```
npm test
```
