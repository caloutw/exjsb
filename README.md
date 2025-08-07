<div align="center">
  <a href="README_EN.md">English</a> | <a href="README.md">繁體中文</a>
</div>

# ExJSB

一個簡單的 JavaScript 執行沙盒，支援 Module/Commandjs。

## 注意

此類方法基本上是以 Module 為基礎運行，因此可能會缺少像是``__dirname``和``__filename``等commandjs預設的參數。

執行時請預設保持``--experimental-vm-modules``開啟，否則會出錯。

## 說明

利用vm還有額外的寫法，可以讓主線程執行外部的js檔案，並且同時提供隔離模式，遇到process類型的指令，可以有效防止程式碼被惡意停止。

原先想法是想說php都可以用伺服器運行某些特定代碼(例如登入)，為了提高js+http的利用性，因此我做了這個。

相比原本的``import``和``require``，此方法可以同時支援兩種型態的js，並且如果出錯後，也會用非同步的方式將錯誤回報給主線程，使程序不會整個停止，因為是動態加載，所以不用像``require``和``import``每次都要做一堆動作才能用，緩存也可以被gc回收(對，我就是在說你``import``)。

自身支援``import.meta.url``，因此可以使用``__dirname``。

## 安裝

```bash
npm install exjsb
```

## 範例

### 含main(基礎用法)

``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 執行腳本
exjsb.execute();
```

``./script.js``
```javascript
//程序主入口
export function main(){
    console.log("Hi");
}
```
---
### 無main
``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 執行腳本
exjsb.execute();
```

``./script.js``
```javascript
console.log("Hi");
```
---
### import物件
``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 執行腳本
exjsb.execute();
```

``./script.js``
```javascript
import fs from 'fs';

console.log(fs);

let os = await import("os");
```
---
### require物件
``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 執行腳本
exjsb.execute();
```

``./script.js``
```javascript
const fs = require("fs");

console.log(fs);
```
---
### 傳遞參數
``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 執行腳本(第一個參數必為錯誤callback)
exjsb.execute((err)=>console.log(err), "Hello", "World");
```

``./script.js``
```javascript
export function main(A, B){
    console.log(A, B);  //Hello World
}
```
---
### 錯誤回傳
``./index.js``
```javascript
import { ExJSB } from 'exjsb';

// 創建一個 ExJSB 實例
const exjsb = new ExJSB('./script.js', true);

// 有錯誤，則不會使程式整個停止
exjsb.execute((err)=>console.log(err));

// 有錯誤，因為沒有callback，因此會終止整個主線程
exjsb.execute();
```

## 授權

此專案採用 [MIT License](LICENSE) 授權。

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
