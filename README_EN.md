<div align="center">
  <a href="README_EN.md">English</a> | <a href="README.md">繁體中文</a>
</div>

# ExJSB

A simple JavaScript execution sandbox that supports both Module and CommonJS.

## Notice

This method is essentially based on Modules, so it may lack some CommonJS default parameters like `__dirname` and `__filename`.

Please keep `--experimental-vm-modules` enabled when running, otherwise it will cause errors.

## Description

Using vm with additional implementations, it allows the main thread to execute external JS files while providing isolation mode. When encountering process-type commands, it can effectively prevent malicious code from stopping the program.

The original idea was that PHP can run certain specific code on servers (such as login), so to improve the utility of JS+HTTP, I created this.

Compared to the original `import` and `require`, this method can support both types of JS simultaneously. If an error occurs, it will report the error to the main thread asynchronously, preventing the entire program from stopping (even for sync function calls to async functions). Since it's dynamically loaded, you don't need to do a lot of work like `require` and `import` every time, and the cache can be garbage collected (yes, I'm talking about you `import`).

It supports `import.meta.url` natively, so you can use `__dirname`.

## Installation

```bash
npm install exjsb
```

## Examples

### With main function (Basic usage)

`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// Execute the script
exjsb.execute();
```

`./script.js`
```javascript
// Program main entry point
export function main(){
    console.log("Hi");
}
```
---
### Without main function
`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// Execute the script
exjsb.execute();
```

`./script.js`
```javascript
console.log("Hi");
```
---
### Import objects
`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// Execute the script
exjsb.execute();
```

`./script.js`
```javascript
import fs from 'fs';

console.log(fs);

let os = await import("os");
```
---
### Require objects
`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// Execute the script
exjsb.execute();
```

`./script.js`
```javascript
const fs = require("fs");

console.log(fs);
```
---
### Passing parameters
`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// Execute the script (first parameter must be error callback)
exjsb.execute((err)=>console.log(err), "Hello", "World");
```

`./script.js`
```javascript
export function main(A, B){
    console.log(A, B);  //Hello World
}
```
---
### Error handling
`./index.js`
```javascript
import { ExJSB } from 'exjsb';

// Create an ExJSB instance
const exjsb = new ExJSB('./script.js', true);

// If there's an error, it won't stop the entire program
exjsb.execute((err)=>console.log(err));

// If there's an error and no callback, it will terminate the entire main thread
exjsb.execute();
```

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2024 Caloutw

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 