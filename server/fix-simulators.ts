import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walkDir('./src/core/engine', (filePath) => {
    if (!filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    if (filePath.includes('/simulators/') || filePath.includes('/processors/') || filePath.includes('/sub-orchestrators/')) {
        content = content.replace(/['"]\.\.\/\.\.\/infrastructure\/(.*)['"]/g, "'../../../infrastructure/$1'");
        content = content.replace(/['"]\.\.\/types\/base['"]/g, "'../../contracts/base'");
        content = content.replace(/['"]\.\.\/types\/node-contracts['"]/g, "'../../contracts/node-contracts'");
        content = content.replace(/['"]\.\.\/\.\.\/types\/base['"]/g, "'../../../core/contracts/base'");
        content = content.replace(/['"]\.\.\/\.\.\/types\/node-contracts['"]/g, "'../../../core/contracts/node-contracts'");
    }

    if (filePath.includes('FlowEngine.ts')) {
        content = content.replace(/['"]\.\/types\/base['"]/g, "'../contracts/base'");
        content = content.replace(/['"]\.\.\/services\/ExecutionEmitter['"]/g, "'../../modules/executions/execution.events'");
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
});
