const ts = require('../../../../../node_modules/typescript');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let errors = 0;
for (const name of fs.readdirSync(root).filter(n => /\.(tsx|ts)$/.test(n))) {
 const result = ts.transpileModule(fs.readFileSync(path.join(root,name),'utf8'), { fileName:name, reportDiagnostics:true, compilerOptions:{jsx:ts.JsxEmit.ReactJSX, target:ts.ScriptTarget.ES2020, module:ts.ModuleKind.CommonJS} });
 for(const d of result.diagnostics || []) { console.log(name,ts.flattenDiagnosticMessageText(d.messageText,'\n')); errors++; }
}
console.log(`Module transpilation: ${errors} errors`);
process.exitCode=errors ? 1 : 0;
