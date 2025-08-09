import vm from 'vm';
import fs from 'fs';
import { AsyncLocalStorage } from "node:async_hooks";
import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";
import { createRequire } from "module";

//path setting.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//require.
const require = createRequire(import.meta.url);

export class ExJSB {
    /**
     * ExJSB - A simple JS execution sandbox with "insulation" mode.
     * 
     * @param {string} path - Js file path.
     * @param {boolean} [insulation=true] - If true, dangerous operations (such as process.exit, require, etc.) will be blocked.
     * 
     * Example:
     *   let a = new ExJSB('process.exit(1);', true);
     *   a.execute();
     *   // process.exit(1) will be invalid, and the main program will NOT exit.
     * 
     * If insulation is false, the code can access all Node.js global objects (not recommended for untrusted code).
     */
    constructor(filepath, insulation = true) {
        // Check --experimental-vm-modules is opened. Throw error.
        const hasExperimentalVMModules = process.execArgv.includes('--experimental-vm-modules');
        if (!hasExperimentalVMModules)
            throw new Error('must add the --experimental-vm-modules execution parameter.');

        // If path is not a string. Throw error.
        if (typeof filepath !== 'string')
            throw new Error('path must be a string.');

        if (!fs.existsSync(filepath))
            throw new Error('file not exist.');

        //If insulation not a boolean. Throw error.
        if (typeof insulation !== "boolean")
            throw new Error("insulation must be a boolean.");

        this.filepath = filepath;
        this.insulation = insulation;

        this.als = new AsyncLocalStorage();
    }

    /**
     * execute JS code on vm.
     * @param {Function} callback - Error callback, if missing this, will throw error.
     * @returns {boolean} - if success return true, otherwise return false.
     */
    execute() {
        //get function parm arg
        let param = Array.from(arguments).slice(1, arguments.length);
        //get function callback arg
        let callback = arguments[0];

        //create a error listener
        const errorHandle = ["uncaughtException", "unhandledRejection"];
        for (let i of errorHandle) {
            const handler = (error) => {
                const isVMError = this.als.getStore()?.code == "ExJSBError";
                if (isVMError && callback) {
                    callback(error);
                    process.removeListener(i, handler);
                    return;
                }

                if (!isVMError && process.listenerCount(i) > 1)
                    return;

                console.error(error);
                process.removeListener(i, handler);
                process.exit(1);
                return;
            };
            process.on(i, handler);
        };

        let cloneGlobal = () => {
            let cloned = Object.defineProperties(
                { ...global },
                Object.getOwnPropertyDescriptors(global),
            );
            // remove 'process' from cloneGlobal
            if ('process' in cloned && this.insulation) {
                delete cloned.process;
            }
            // add 'require'
            cloned.require = require;
            return cloned;
        };

        let context = vm.createContext(cloneGlobal());
        
        let vm_CODE = fs.readFileSync(this.filepath, "utf-8");

        const sendbox = new vm.SourceTextModule(vm_CODE, {
            context: context,
            identifier: this.filepath,
            initializeImportMeta(meta) { meta.url = `file://${this.filepath}`; },
            importModuleDynamically(specifier) { return import(specifier); }
        });

        this.als.run({code: "ExJSBError"}, async () => {
            await sendbox.link(async (specifier, referencingModule) => {
                const target = await (async () => { try { return await import(specifier); } catch (e) { throw new Error(e); return false; } })();
    
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
    
            await sendbox.evaluate();
    
            if (sendbox.namespace.main) {
                await sendbox.namespace.main(...param);
            }
    
            return true;
        });
    }
}

// 兼容 CommonJS 匯出
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { ExJSB };
}