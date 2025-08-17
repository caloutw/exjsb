<div align="center">
English | <a href="README_ZH.md">繁體中文</a>
</div>

# ExJSB
A simple JavaScript execution sandbox supporting both Module and CommonJS.

## Notice
Please make sure to enable ``--experimental-vm-modules`` by default when running, otherwise errors may occur.

This environment runs with ES6 modules, so please ensure your Node.js version is greater than 16.0.

## Description
By leveraging the `vm` module and additional techniques, the main thread can execute external JavaScript files while providing an isolated mode.  
When encountering `process`-related instructions, this can effectively prevent malicious code from stopping the program.

The original idea came from the fact that PHP can run specific code on servers (such as login).  
To enhance the usability of JavaScript + HTTP, I created this.

Compared to native ``import`` and ``require``, this method supports both formats simultaneously.  
When an error occurs, it asynchronously reports back to the main thread, ensuring the entire process will not crash.  
Since it uses dynamic loading, there’s no need to repeatedly set up everything like ``require`` or ``import``.  
Caching can also be garbage-collected (yes, I’m looking at you, ``import``).

It also supports ``import.meta.url``, which allows the use of ``__dirname``.

## Installation
```bash
npm install exjsb
```

## Example

``./index.js``

```javascript
import { ExJSB } from 'exjsb';
import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create an ExJSB instance, specify the path, and enable isolation mode
const exjsb = new ExJSB(path.join(__dirname, "script.js"), true);

// Execute the script
exjsb.execute((error)=>{
    console.log(error)
}, "Hi", "Hello", "javascript.");
```

``./script.js``

```javascript
import fs from "fs";
const os = require("os");
import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Program main entry
export function main(A, B, C){
    console.log(A + " " + B + " " + C); // Hi Hello javascript.
    console.log(os.cpus);
    console.log(fs.readFileSync(path.join(__dirname, "mybook.txt"), "utf-8"));
}
```

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2025 Caloutw
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.