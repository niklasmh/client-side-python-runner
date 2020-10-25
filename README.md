# Client-side Python runner

```bash
npm i client-side-python-runner --save
```

## Usage

Simple example:

```javascript
import pythonRunner from 'client-side-python-runner';

pythonRunner.runCode('print("printed from pyodide")'); // Currently defaults to use pyodide

// Set the use-option to specify which engine to use
pythonRunner.runCode('print("printed from skulpt")', {
  use: 'skulpt',
});
```

<details>
<summary>Advanced example</summary>

This will probably be more advanced in the future.

```javascript
import pythonRunner from 'client-side-python-runner';

// Load engines on beforehand
await pythonRunner.loadEngines(['pyodide', 'skulpt']);

// Set current engine
await pythonRunner.useEngine('skulpt');

// Set options (this will merge with existing options)
pythonRunner.setOptions({
  output: console.log,
  input: prompt,
});

// Run the code
await pythonRunner.runCode('print("printed from skulpt")');

// Switch engine
await pythonRunner.useEngine('pyodide');

// Run the code again, but in pyodide
await pythonRunner.runCode('print("printed from pyodide")');
```

</details>

## Why

There are a lot of client-side Python runners out there, and they all have [benefits and disadvantages](https://stromberg.dnsalias.org/~strombrg/pybrowser/python-browser.html). Some can take a lot of loading time, and others are missing libraries you need (e.g. `numpy`) as well as core functionality (e.g. `time.sleep`). This package joins a few of the alternatives giving you the freedom to easily choose what you want in your project right now - without having to do major changes in your code. It also allows for using multiple interpreters at the same time!

Another benefit with using this library is that it can adapt to new Python runners that comes along. The world has just started with exploring the capabilities with Web Assembly (WASM) meaning there will be a lot of trial and error before we find an optimal solution. So far, Pyodide has done a pretty thorough job with this, but other versions like Skulpt loads much faster which - depending on your project - could be an essential factor.

## Map of different Python runners

The choices below are highly inspired by [this article](https://yasoob.me/2019/05/22/running-python-in-the-browser/) and consists of currently working client-side Python runners. When denoting **client-side** Python runners, it means that the Python code is compiled and executed on the client side; not having to send the code to a server and return the result back to the client in form of compiled code or the actual result from the execution. This makes your project not dependent on servers (this is big!) and not prune to security issues as you only work in the browser sandbox.

_DISCLAIMER: The numbers in the table are not scientifically calculated, thus they have been ran on the same machine multiple times and measured using the same tool (Chrome DevTools with cache disabled)._

| Python runner            | Python 3 | Python 2 | Computation\*              | Loading time | Memory   | Packages                                 |
| ------------------------ | -------- | -------- | -------------------------- | ------------ | -------- | ---------------------------------------- |
| [Pyodide][pyodide]       | ✔        |          | Fast (1.106s - WASM)       | ~3600ms      | ~23000kB | [Most scientific libraries][pyodide-lib] |
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

As you may have noticed, this project is still in progress. It may not be complete until late 2021, but I will attempt to deliver a working version ASAP - such that it is possible to get feedback and evaluate if this actually could be a useful project. However, until any version is released, a few things needs to be done:

## First release

- [x] Decide which Python runner to include. So far it looks like Pyodide, Skulpt. When these are added, it will be easier to include others later.
- [x] Decide upon how the interface should work. E.g. one would probably need a run function, some way to output results and handle errors. What about loading libraries or manipulating DOM elements?
- [x] Publish the project as an NPM package. Then we are done with the first release!

## Later

- [ ] Include more Python runners.
- [x] Create examples of usage.
- [x] Lazy loading Python runners - because this is probably not something you want to deal with until you actually want to run the Python code.
- [ ] Make it possible to run them offline (by building them into the project somehow)
