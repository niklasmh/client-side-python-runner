/**
 * @function hasEngine
 * @param {Engine} engine
 * @returns {boolean}
 */
export function hasEngine(engine: Engine): boolean;
/**
 * @function engineExists
 * @param {Engine} engine
 * @returns {boolean}
 */
export function engineExists(engine: Engine): boolean;
/**
 * @function getOptions
 * @returns {Options}
 */
export function getOptions(): Options;
/**
 * @function setOptions
 * @param {Options} options
 */
export function setOptions(options: Options): void;
/**
 * @async
 * @function setEngine
 * @param {Engine} engine
 */
export function setEngine(engine: Engine): Promise<boolean>;
/**
 * @typedef {Object} PythonError
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
 * @function interpretErrorMessage
 * @param {any} error
 * @param {string} code
 * @param {string} engine
 * @returns {PythonError}
 */
export function interpretErrorMessage(error: any, code: string, engine: string): PythonError;
/**
 * @async
 * @function loadEngine
 * @param {Engine} engine
 * @returns {boolean} If engine was loaded (or already loaded)
 * @throws {Error} If engine does not exist
 */
export function loadEngine(engine?: Engine, { useEngine }?: {
    useEngine?: boolean | undefined;
}): boolean;
/**
 * @async
 * @function loadEngines
 * @param {Engine[]} engines
 */
export function loadEngines(engines: Engine[]): Promise<boolean[]>;
/**
 * @async
 * @function runCode
 * @param {{use?: Engine}=} userOptions
 * @returns {any=} Last result from pyodide. (Not the other runners)
 * @throws {Error|PythonError} Invalid python engine | A python error
 */
export function runCode(code: any, userOptions?: {
    use?: Engine;
} | undefined): any | undefined;
/**
 * @async
 * @function getVariable
 * @param {{use?: Engine}=} userOptions
 * @returns {any}
 */
export function getVariable(name: any, userOptions?: {
    use?: Engine;
} | undefined): any;
/**
 * @async
 * @function getVariables
 * @param {{use?: Engine, includeValues?: boolean, filter?: null | (name) => boolean, onlyShowNewVariables?: boolean}=} userOptions
 * @returns {Variables|string[]}
 */
export function getVariables(userOptions?: {
    use?: Engine | undefined;
    includeValues?: boolean | undefined;
    filter?: ((name: any) => boolean) | null | undefined;
    onlyShowNewVariables?: boolean | undefined;
} | undefined): Variables | string[];
/**
 * @async
 * @function setVariable
 * @param {string} name
 * @param {any} value
 * @param {{use?: Engine}=} userOptions
 */
export function setVariable(name: string, value: any, userOptions?: {
    use?: Engine;
} | undefined): Promise<any>;
/**
 * @async
 * @function setVariables
 * @param {Variables} variables
 * @param {{use?: Engine}=} userOptions
 */
export function setVariables(variables: Variables, userOptions?: {
    use?: Engine;
} | undefined): Promise<any>;
/**
 * @async
 * @function clearVariable
 * @param {string} name
 * @param {{use?: Engine}=} userOptions
 */
export function clearVariable(name: string, userOptions?: {
    use?: Engine;
} | undefined): Promise<any>;
/**
 * @async
 * @function clearVariables
 * @param {{use?: Engine}=} userOptions
 */
export function clearVariables(userOptions?: {
    use?: Engine;
} | undefined): Promise<any>;
export default pythonRunner;
export type PythonError = {
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
export type Engine = "skulpt" | "pyodide" | "brython";
export type Options = {
    /**
     * The output from Python print()-functions
     */
    output?: ((...data: any[]) => void) | undefined;
    /**
     * Parsed Python error messages
     */
    error?: ((error?: PythonError | undefined) => void) | null | undefined;
    /**
     * Python input()-function
     */
    input?: ((message: string, _default?: string | undefined) => void) | undefined;
    pythonVersion?: number | undefined;
    loadVariablesBeforeRun?: boolean | undefined;
    storeVariablesAfterRun?: boolean | undefined;
    onLoading?: ((engine: Engine) => void) | undefined;
    onLoaded?: ((engine: Engine) => void) | undefined;
};
export type Variables = {
    [name: string]: any;
};
export type LoadedEngine = {
    runnerReference: any;
    currentCode: string;
    engine: string;
    predefinedVariables: string[];
    runCode: typeof runCode;
    getVariable: typeof getVariable;
    getVariables: typeof getVariables;
    setVariable: typeof setVariable;
    setVariables: typeof setVariables;
    clearVariable: typeof clearVariable;
    clearVariables: typeof clearVariables;
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
    loadEngine: typeof loadEngine;
    loadEngines: typeof loadEngines;
    setEngine: typeof setEngine;
    hasEngine: typeof hasEngine;
    isLoadingEngine: typeof isLoadingEngine;
    getOptions: typeof getOptions;
    setOptions: typeof setOptions;
    runCode: typeof runCode;
    getVariable: typeof getVariable;
    getVariables: typeof getVariables;
    setVariable: typeof setVariable;
    setVariables: typeof setVariables;
    clearVariable: typeof clearVariable;
    clearVariables: typeof clearVariables;
    options: Options;
};
/**
 * @typedef {{[name: string]: any}} Variables
 */
/**
 * @typedef {Object} LoadedEngine
 * @property {any} runnerReference
 * @property {string} currentCode
 * @property {string} engine
 * @property {string[]} predefinedVariables
 * @property {runCode} runCode
 * @property {getVariable} getVariable
 * @property {getVariables} getVariables
 * @property {setVariable} setVariable
 * @property {setVariables} setVariables
 * @property {clearVariable} clearVariable
 * @property {clearVariables} clearVariables
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
 * @property {loadEngine} loadEngine
 * @property {loadEngines} loadEngines
 * @property {setEngine} setEngine
 * @property {hasEngine} hasEngine
 * @property {isLoadingEngine} isLoadingEngine
 * @property {getOptions} getOptions
 * @property {setOptions} setOptions
 * @property {runCode} runCode
 * @property {getVariable} getVariable
 * @property {getVariables} getVariables
 * @property {setVariable} setVariable
 * @property {setVariables} setVariables
 * @property {clearVariable} clearVariable
 * @property {clearVariables} clearVariables
 * @property {Options} options
 */
/** @type {PythonRunner} */
declare const pythonRunner: PythonRunner;
/**
 * @function isLoadingEngine
 * @param {Engine} engine
 * @returns {boolean}
 */
declare function isLoadingEngine(engine: Engine): boolean;
