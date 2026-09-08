const ts = require('../../../../../node_modules/typescript');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname,'..');
const files = fs.readdirSync(root).filter(n=>/\.(ts|tsx)$/.test(n)).map(n=>path.join(root,n));
const config = ts.readConfigFile(path.resolve(root,'../../../../tsconfig.json'),ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config,ts.sys,path.resolve(root,'../../../..'));
const program = ts.createProgram(files,{...parsed.options,noEmit:true,incremental:false,skipLibCheck:true});
let errors=0;
for(const file of files) {
 const source=program.getSourceFile(file);
 for(const d of [...program.getSyntacticDiagnostics(source),...program.getSemanticDiagnostics(source)]) {
   console.log(ts.formatDiagnostic(d,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));errors++;
 }
}
console.log('Module type diagnostics:',errors);process.exitCode=errors?1:0;
