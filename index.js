import vm from 'vm';
import fs from 'fs';
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "module";
import path from 'node:path';

//require.
const require = createRequire(import.meta.url);

//errorHandle
let errorLogger = new AsyncLocalStorage();
const errorHandle = ["uncaughtException", "unhandledRejection"];
for (let i of errorHandle) {
    const handler = (error) => {
        const isVMError = (error.code == "ExJSBError" || errorLogger.getStore()?.code == "ExJSBError");
        const errorCallback = errorLogger.getStore()?.callback || (typeof error.callback === "function" ? error.callback() : false);
        
        if ((!isVMError || (isVMError && (errorCallback == undefined || typeof errorCallback !== 'function'))) && process.listenerCount(i) == 1) {
            console.error(error);
            process.exit(1);
        }

        if (isVMError && errorCallback !== undefined && typeof errorCallback === 'function') {
            errorCallback(error);
        }

        return;
    }
    process.on(i, handler);
}

export class ExJSB {
    constructor(filepath, insulation = true) {
        if (!process.execArgv.includes('--experimental-vm-modules'))
            throw new Error('Must add the --experimental-vm-modules execution parameter.');

        if (!filepath)
            throw new Error('filepath missing.');

        if (!fs.existsSync(filepath) || typeof filepath !== "string")
            throw new Error(`${filepath} not exist.`);

        if (typeof insulation !== 'boolean')
            insulation = true;

        this.filepath = filepath;
        this.insulation = insulation;
        this.callback = undefined;

        this.sendbox = undefined;
    }

    async initialization(errorCallback) {
        this.callback = errorCallback;
        const getCallback = () => { return this.callback; };

        let cloneGlobal = () => {
            let cloned = Object.defineProperties(
                { ...global },
                Object.getOwnPropertyDescriptors(global),
            );
            // remove 'process' from cloneGlobal
            if ('process' in cloned && this.insulation) {
                delete cloned.process;
            }

            // remake 'Error' class
            const OriginalError = global.Error;
            class SandboxedError extends OriginalError {
                constructor(message) {
                    super(message);
                    Object.defineProperty(this, 'callback', {
                        value: getCallback,
                        writable: false,
                        enumerable: false,
                        configurable: false
                    });

                    Object.defineProperty(this, 'code', {
                        value: "ExJSBError",
                        writable: false,
                        enumerable: false,
                        configurable: false
                    });

                    if (OriginalError.captureStackTrace) {
                        OriginalError.captureStackTrace(this, SandboxedError);
                    }
                }
            }
            cloned.Error = SandboxedError;

            // add 'require'
            cloned.require = require;
            return cloned;
        };

        let context = vm.createContext(cloneGlobal());

        let vm_CODE = fs.readFileSync(this.filepath, "utf-8");

        this.sendbox = new vm.SourceTextModule(vm_CODE, {
            context: context,
            identifier: this.filepath,
            initializeImportMeta: (meta) => { meta.url = `file://${this.filepath}`; },
            importModuleDynamically: (specifier) => { return import(specifier.startsWith(".") ? path.join(this.filepath, "..", specifier):specifier); }
        });

        let result = errorLogger.run({
            code: "ExJSBError",
            callback: errorCallback
        }, async () => {
            await this.sendbox.link(async (specifier, referencingModule) => {
                const target = await import(specifier.startsWith(".") ? path.join(this.filepath, "..", specifier):specifier);

                if (!target) return false;

                const module_METHOD = (() => {
                    let support_List = [];

                    if (target.default) support_List.push("default");
                    Object.keys(target).forEach((key) => {
                        if (key != "default") support_List.push(key);
                    });

                    return support_List;
                })();

                return new vm.SyntheticModule(
                    module_METHOD,
                    function () { for (let method of module_METHOD) this.setExport(method, target[method]); },
                    { context: referencingModule.context }
                );
            });

            try {
                await this.sendbox.evaluate();
            } catch(e) {
                errorCallback(e);
            }

            return true;
        });

        return result;
    }

    async run(errorCallback, funcName) {
        this.callback = errorCallback;

        //get function parm arg
        let param = Array.from(arguments).slice(2, arguments.length);
        const execFunc = this.sendbox.namespace[funcName];

        if (!execFunc){
            if(typeof errorCallback !== "function")
                throw new Error("Function name not exist.");
            else
                errorCallback("Function name not exist.");

            return null;
        }
        
        let result =  await errorLogger.run({
            code: "ExJSBError",
            callback: errorCallback
        }, async () => {
            try {
                return await execFunc(...param);
            } catch (e) {
                if(typeof errorCallback !== "function")
                    throw new Error(e);
                errorCallback(e);
                return null;
            }
        });

        return result ?? null;
    }

    destroy(){
        this.filepath = null;
        this.insulation = null;
        this.sendbox = null;

        if(global.gc)
            global.gc();

        return true;
    }

    //舊架構支援
    async execute() {
        //get function parm arg
        let param = Array.from(arguments).slice(1, arguments.length);
        //get function callback arg
        let callback = arguments[0];

        if(!this.sendbox){
            await this.initialization(callback);
        }

        if(this.sendbox.namespace["main"]){
            return await this.run(callback, "main", ...param);
        }

        this.destroy();

        return true;
    }
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { ExJSB };
}