### Version 1.6.4

- Fix turtle import in Skulpt
- Add some more control to Skulpt canvas
- Add first and last flag to loading methods

### Version 1.6.3

- Add async signature to skulpt creator
- Fix issue with Skulpt not getting initial variables

### Version 1.6.2

- Make sure input objects have optional keys.

### Version 1.6.1

- Add more tests.
- Fix types that did not get the correct signature.
- Update docs with more detailed signatures on functions.

### Version 1.6.0

- Add tests.
- Add types.

### Version 1.5.1

- Make variable management in Brython support nan and +/-inf.

### Version 1.5.0

- Add variable management support for Brython. However, it only works on numbers, strings, complex numbers, None and boolean - not classes, functions, nan and +/-inf.

### Version 1.4.4

- Fix Pyodide variable support (as it actually broke when upgrading in version 1.4.0). Really need some tests such that this does not happen again.
- Remove repeating examples from docs and add variable management example.

### Version 1.4.3

- Fixing bugs with prepare script execution.

### Version 1.4.1

- Update README.
- Create a prepare script for setting docs URL correct each time before publishing.
- Create a CHANGELOG file.

### Version 1.4.0

- Refactor demo page. Easier to maintain.
- Update Pyodide version.
- Add Brython.
- Add TypeScript support.

### Version 1.3.0

- Add variable handling examples in the docs.
- Update design on the docs.
- Use monaco editor with python highlighting in the docs.
- Fix line offset with Skulpt as of injecting variables before the code. Now defining the variables different.
- Rename `storeStateBetweenRuns` to `loadVariablesBeforeRun` and `storeVariablesAfterRun` giving the user more control as well as understanding og what is actually happening when setting these.
- Fix variable handling in Skulpt.

### Version 1.2.5

- Fix broken demo. This was luckily not affecting the package and documentation itself.

### Version 1.2.4

- Add option for listening on loading of engines such that it is possible to get more control.

### Version 1.2.1

- Add function for setting multiple variables at once: `setVariables`.

### Version 1.2.0

- Make `getVariable(name)`, `setVariable(name, value)`, and `clearVariable(name)` work with skulpt.
- Add function for getting all variables: `getVariables({filter, includeValues, onlyShowNewVariables})`.
- Add option for storing state (variables) between runs: storeStateBetweenRuns.
- Add more options for each run: `runCode(code, {variables, clearVariablesBeforeRun, updateVariables})`. `variables` makes it possible to inject new variables before the run. `clearVariablesBeforeRun` makes it possible to clear all variables before the run such that you start fresh. `updateVariables` makes it possible to store the variables after the run - such that they can be injected into the next run. The behavior should be consistent between pyodide and skulpt.

### Version 1.1.5

- Rename `useEngine` to `setEngine` as CRA treats "use" functions as hooks.
- Add functions for handling variables (if possible): `getVariable(name)`, `setVariable(name, value)`, and `clearVariable(name)`.

### Version 1.1.1

- Add more examples.
- Fix a bug with finding line number in recursion errors.

### Version 1.1.0

- Return consistent error messages across all engines as well as extract line and column numbers (if possible). This is essential feedback to users.

### Version 1.0.1

- Running code again before the engine has loaded leads to an error as it failes to load multiple times in a row. Resolved by adding the awaiting code to a queue, then execute them in order when the engine is ready.

### First release (1.0.0)

- [x] Decide which Python runner to include. So far it looks like Pyodide, Skulpt. When these are added, it will be easier to include others later.
- [x] Decide upon how the interface should work. E.g. one would probably need a run function, some way to output results and handle errors. What about loading libraries or manipulating DOM elements?
- [x] Publish the project as an NPM package. Then we are done with the first release!
- [x] Create examples of usage.
- [x] Lazy loading Python runners - because this is probably not something you want to deal with until you actually want to run the Python code.
