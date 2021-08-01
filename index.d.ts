/**
 * @typedef {Object} Error
 * @property {number} columnNumber
 * @property {Engine} engine
 * @property {Error} error
 * @property {string} code
 * @property {(n: number) => string[]} getNLinesAbove
 * @property {(n: number) => string[]} getNLinesBelow
 * @property {string} line
 * @property {number} lineNumber
 * @property {string} message
 * @property {string} type
 */
/**
 * @callback InterpretErrorMessage
 * @param {any} error
 * @param {string} code
 * @param {string} engine
 * @returns {Error}
 */
export function interpretErrorMessage(error: any, code: any, engine: any): {
    columnNumber: number | null;
    engine: any;
    error: any;
    code: any;
    getNLinesAbove: (n: any) => any;
    getNLinesBelow: (n: any) => any;
    line: any;
    lineNumber: number | null;
    message: string | null;
    type: any;
};
export function hasEngine(engine: any): boolean;
export function getOptions(): Options;
export function setOptions(options: any): void;
export function setEngine(engine: any): Promise<boolean>;
export function loadEngine(engine?: Engine, { useEngine }?: {
    useEngine?: boolean | undefined;
}): Promise<boolean>;
export function loadEngines(engines: any): Promise<[any, any, any, any, any, any, any, any, any, any]>;
export function runCode(code: any, userOptions?: {}): Promise<any>;
export function getVariable(name: any, userOptions?: {}): Promise<any>;
export function getVariables(userOptions?: {
    includeValues: boolean;
    filter: null;
    onlyShowNewVariables: boolean;
}): Promise<any>;
export function setVariable(name: any, value: any, userOptions?: {}): Promise<any>;
export function setVariables(variables: any, userOptions?: {}): Promise<any>;
export function clearVariable(name: any, userOptions?: {}): Promise<any>;
export function clearVariables(userOptions?: {}): Promise<any>;
export default pythonRunner;
export type Error = {
    columnNumber: number;
    engine: Engine;
    error: Error;
    code: string;
    getNLinesAbove: (n: number) => string[];
    getNLinesBelow: (n: number) => string[];
    line: string;
    lineNumber: number;
    message: string;
    type: string;
};
export type InterpretErrorMessage = (error: any, code: string, engine: string) => Error;
export type Engine = "skulpt" | "pyodide" | "brython";
export type Options = {
    /**
     * The output from Python print()-functions
     */
    output: (...data: any[]) => void;
    /**
     * Parsed Python error messages
     */
    error: ((error?: Error | undefined) => void) | null;
    /**
     * Python input()-function
     */
    input: (message: string, _default?: string | undefined) => void;
    pythonVersion: number;
    loadVariablesBeforeRun: boolean;
    storeVariablesAfterRun: boolean;
    onLoading: (engine: Engine) => void;
    onLoaded: (engine: Engine) => void;
};
export type Variables = {
    [name: string]: any;
};
export type LoadedEngine = {
    runnerReference: any;
    currentCode: string;
    engine: string;
    predefinedVariables: string[];
    runCode: RunCode;
    getVariable: GetVariable;
    getVariables: GetVariables;
    setVariable: SetVariable;
    setVariables: SetVariables;
    clearVariable: ClearVariable;
    clearVariables: ClearVariables;
    variables: {
        [name: string]: any;
    };
};
export type PythonRunner = {
    loadedEngines: {};
    loadingEngines: {};
    loadingScripts: {
        [url: string]: boolean;
    };
    /**
     * Turn on logging
     */
    debug: boolean;
    debugFunction: ((output: string) => void) | null;
    currentEngine: Engine;
    loadEngine: LoadEngine;
    loadEngines: LoadEngines;
    setEngine: SetEngine;
    hasEngine: HasEngine;
    isLoadingEngine: IsLoadingEngine;
    getOptions: GetOptions;
    setOptions: SetOptions;
    runCode: RunCode;
    getVariable: GetVariable;
    getVariables: GetVariables;
    setVariable: SetVariable;
    setVariables: SetVariables;
    clearVariable: ClearVariable;
    clearVariables: ClearVariables;
    options: Options;
};
export type HasEngine = (engine: Engine) => any;
export type IsLoadingEngine = (engine: Engine) => any;
export type GetOptions = () => Options;
export type SetOptions = (options: Options) => any;
export type SetEngine = (engine: Engine) => any;
export type LoadEngine = (engine: Engine) => any;
export type LoadEngines = (engines: Engine[]) => any;
export type RunCode = (userOptions?: {
    use: Engine;
} | undefined) => any;
export type GetVariable = (userOptions?: {
    use: Engine;
} | undefined) => any;
export type GetVariables = (userOptions?: {
    use: Engine;
    includeValues: boolean;
    filter: ((name: any) => boolean) | null;
    onlyShowNewVariables: boolean;
} | undefined) => Variables | string[];
export type SetVariable = (name: string, value: any, userOptions?: {
    use: Engine;
} | undefined) => any;
export type SetVariables = (variables: Variables, userOptions?: {
    use: Engine;
} | undefined) => any;
export type ClearVariable = (name: string, userOptions?: {
    use: Engine;
} | undefined) => any;
export type ClearVariables = (userOptions?: {
    use: Engine;
} | undefined) => any;
/**
 * @typedef {{[name: string]: any}} Variables
 */
/**
 * @typedef {Object} LoadedEngine
 * @property {any} runnerReference
 * @property {string} currentCode
 * @property {string} engine
 * @property {string[]} predefinedVariables
 * @property {RunCode} runCode
 * @property {GetVariable} getVariable
 * @property {GetVariables} getVariables
 * @property {SetVariable} setVariable
 * @property {SetVariables} setVariables
 * @property {ClearVariable} clearVariable
 * @property {ClearVariables} clearVariables
 * @property {{[name: string]: any}} variables
 */
/**
 * @typedef {Object} PythonRunner
 * @property {{[engine: Engine]: LoadedEngine}} loadedEngines
 * @property {{[engine: Engine]: (couldNotLoad: boolean) => void}} loadingEngines
 * @property {{[url: string]: boolean}} loadingScripts
 * @property {boolean} debug Turn on logging
 * @property {null | (output: string) => void} debugFunction
 * @property {Engine} currentEngine
 * @property {LoadEngine} loadEngine
 * @property {LoadEngines} loadEngines
 * @property {SetEngine} setEngine
 * @property {HasEngine} hasEngine
 * @property {IsLoadingEngine} isLoadingEngine
 * @property {GetOptions} getOptions
 * @property {SetOptions} setOptions
 * @property {RunCode} runCode
 * @property {GetVariable} getVariable
 * @property {GetVariables} getVariables
 * @property {SetVariable} setVariable
 * @property {SetVariables} setVariables
 * @property {ClearVariable} clearVariable
 * @property {ClearVariables} clearVariables
 * @property {Options} options
 */
/** @type {PythonRunner} */
declare const pythonRunner: PythonRunner;
