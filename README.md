# Client-side Python runner

Supported python runners so far: [Pyodide][pyodide], [Skulpt][skulpt]

```bash
npm i client-side-python-runner --save
# OR
yarn add client-side-python-runner
```

## Usage

Pyodide example:

```javascript
import { runCode } from 'client-side-python-runner';

// Run any Python code (runs using pyodide by default):
runCode('print("printed from pyodide")\n1337').then((result) =>
  console.log(result)
);
// Output in console.log:
// > printed from pyodide <- From print function
// > 1337 <- Returned from the execution (pyodide only)
```

Skulpt example:

```javascript
import { runCode } from 'client-side-python-runner';

runCode('print("printed from skulpt")', {
  use: 'skulpt',
});
// Output in console.log:
// > printed from skulpt
```

Setting options:

```javascript
import { setOptions } from 'client-side-python-runner';

setOptions({
  output: console.log, // Output from print(...)-functions
  error: null, // Throws an exception unless this is set to a function
  input: prompt, // How to feed the input(...)-function
  pythonVersion: 3,
});
```

<details>
<summary>Advanced example</summary>

This will probably be more advanced in the future.

```javascript
import {
  loadEngines,
  loadEngine,
  useEngine,
  setOptions,
  runCode,
} from 'client-side-python-runner';

// Load engines on beforehand
await loadEngines(['pyodide', 'skulpt']);
// OR
await loadEngine('pyodide');
await loadEngine('skulpt');

// Set current engine
await useEngine('skulpt');

// Set options (this will merge with existing options)
setOptions({
  // This represents the values returned from the print
  // function in Python.
  output: (arg) => console.log(arg),

  // Some engines can stop and wait for input, others
  // cannot. To be safe, prompt is the default as it
  // stops JavaScript altogether and thereforeworks on
  // all cases.
  input: (question) => prompt(question),

  // Here you can opt into getting interpreted error
  // feedback with line numbers and error types or just
  // attempt to interpret these errors yourself.
  error: (err) => console.error(err.lineNumber, err.error),

  // Version 3 is default, unless it is not possible
  // using the current engine
  pythonVersion: 3,
});

// Run the code
await runCode('print("printed from skulpt")');

// Switch engine
await useEngine('pyodide');

// Run the code again, but in pyodide (which also can
// return the result from the last execution)
const pyodideResult = await runCode(`
a = 1200
b = 137
print("printed from pyodide")
"this is the returned value " + str(a + b)
`);
```

</details>

## Using it as a loader only

If you want all the control - but not want to deal with loading of necessary scripts, it is possible to just use the loader:

```javascript
import { loadEngine } from 'client-side-python-runner';

await loadEngine('pyodide');

// After this, the window.pyodide is ready
window.pyodide.runPython("print('I am using pyodide directly instead')");
```

## Why

There are a lot of client-side Python runners out there, and they all have [benefits and disadvantages](https://stromberg.dnsalias.org/~strombrg/pybrowser/python-browser.html). Some can take a lot of loading time, and others are missing libraries you need (e.g. `numpy`) as well as core functionality (e.g. `time.sleep`). This package joins a few of the alternatives giving you the freedom to easily choose what you want in your project right now - without having to do major changes in your code. It also allows for using multiple interpreters at the same time!

Another benefit with using this library is that it can adapt to new Python runners that comes along. The world has just started with exploring the capabilities with Web Assembly (WASM) meaning there will come potentially more optimal soultions out there soon. However, so far, Pyodide has done a pretty thorough job with this, but other engines like Skulpt (not WASM) still loads much faster which - depending on your project - could be an essential factor.

## Map of different Python runners

The choices below are highly inspired by [this article](https://yasoob.me/2019/05/22/running-python-in-the-browser/) and consists of currently working client-side Python runners. When denoting **client-side** Python runners, it means that the Python code is compiled and executed on the client side; not having to send the code to a server and return the result back to the client in form of compiled code or the actual result from the execution. This makes your project not dependent on servers (this is big!) and not prune to security issues as you only work in the browser sandbox.

_DISCLAIMER: The numbers in the table are not scientifically calculated, thus they have been ran on the same machine multiple times and measured using the same tool (Chrome DevTools with cache disabled)._

| Python runner            | Python 3 | Python 2 | Computation\*              | Loading time | Memory   | Packages                                 |
| ------------------------ | -------- | -------- | -------------------------- | ------------ | -------- | ---------------------------------------- |
| [Pyodide][pyodide]       | ✔        |          | Fast (1.106s - WASM)       | ~1750ms      | ~7400kB  | [Most scientific libraries][pyodide-lib] |
| [PyPy.js][pypyjs]        |          | ✔        | Very fast (0.034s - JS)    | ~1900ms      | ~15000kB | Browser                                  |
| [Skulpt][skulpt]         | ✔        | ✔        | Fast (1.329s - JS)         | ~150ms       | ~227kB   | TurtleGraphics                           |
| [Brython][brython]       | ✔        |          | Slow (3.445s - JS)         | ~200ms       | ~184kB   | Browser                                  |
| [RustPython][rustpython] | ✔        |          | Very slow (11.567s - WASM) | ~200ms       | ~184kB   | Browser                                  |

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

# Plan

As you may have noticed, this project is still in progress. It may not be fully complete until late 2021, but I have made a working version - such that it is possible to get feedback and evaluate if this actually could be a useful project.

## First release (1.0.0)

- [x] Decide which Python runner to include. So far it looks like Pyodide, Skulpt. When these are added, it will be easier to include others later.
- [x] Decide upon how the interface should work. E.g. one would probably need a run function, some way to output results and handle errors. What about loading libraries or manipulating DOM elements?
- [x] Publish the project as an NPM package. Then we are done with the first release!
- [x] Create examples of usage.
- [x] Lazy loading Python runners - because this is probably not something you want to deal with until you actually want to run the Python code.

### Version 1.0.1

#### Fixed bugs

- [x] Running code again before the engine has loaded leads to an error as it failes to load multiple times in a row. Resolved by adding the awaiting code to a queue, then execute them in order when the engine is ready.

### Version 1.1.0

#### Added features

- [x] Return consistent error messages across all engines as well as extract line and column numbers (if possible). This is essential feedback to users.

## Later

- [ ] Include more Python runners.
- [ ] Make it possible to run them offline (by building them into the project somehow)
- [ ] Add portals between JavaScript and Python. Useful for executing functions outside the Python scope and the other way around (if possible).
