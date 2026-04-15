import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const replacements = [
    { from: /['"](.*)emailService['"]/g, to: "'$1email.service'" },
    { from: /['"](.*)telegram-service['"]/g, to: "'$1telegram.service'" },
    { from: /['"](.*)whatsapp-service['"]/g, to: "'$1whatsapp.service'" },
    { from: /['"]\.\/(.*)\.handlers['"]/g, to: "'./controllers/$1.admin.controller'" },
    { from: /['"]\.\.\/\.\.\/environments['"]/g, to: "'../../shared/config/environments'" },
    { from: /['"]\.\.\/\.\.\/shared\/constants\/tokens['"]/g, to: "'../../../shared/constants/tokens'" },
    { from: /['"]\.\.\/\.\.\/characters\/schema['"]/g, to: "'../../../core/characters/schema'" },
    { from: /['"]\.\.\/characters\/schema['"]/g, to: "'../../core/characters/schema'" },
    { from: /['"]\.\.\/\.\.\/infrastructure\/database\/models\/(.*)['"]/g, to: "'../../../infrastructure/database/models/$1'" },
    { from: /['"]\.\/middleware['"]/g, to: "'../../../api/middlewares/auth'" },
    { from: /['"]\.\.\/modules\/bots\/botRoutes['"]/g, to: "'../modules/bots/bots.controller'" },
    { from: /['"]\.\.\/modules\/ai\/aiRoutes['"]/g, to: "'../modules/ai/ai.controller'" },
    { from: /['"]\.\.\/modules\/templates\/templateRoutes['"]/g, to: "'../modules/agents/template.controller'" },
    { from: /['"]\.\.\/modules\/exports\/exportRoutes['"]/g, to: "'../modules/agents/agent-export.controller'" },
    { from: /['"]\.\.\/modules\/creators\/creatorRoutes['"]/g, to: "'../modules/marketplace/creator.controller'" },
    { from: /['"]\.\.\/modules\/exports\/exports\.controller['"]/g, to: "'../modules/agents/agent-export.controller'" },
];

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    replacements.forEach(r => {
        const newC = content.replace(r.from, r.to);
        if (newC !== content) {
            content = newC;
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log("Updated " + filePath);
    }
});
