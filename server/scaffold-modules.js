import * as fs from 'fs';
import * as path from 'path';

const modulesConfig = [
    { name: 'workspaces', prefix: 'workspace', type: 'full' },
    { name: 'payments', prefix: 'payment', type: 'no-validation' },
    { name: 'support', prefix: 'support', type: 'no-validation' },
    { name: 'reviews', prefix: 'review', type: 'no-validation' },
    { name: 'marketplace', prefix: 'marketplace', type: 'no-validation' },
    { name: 'blog', prefix: 'blog', type: 'no-validation' },
    { name: 'bots', prefix: 'bot', type: 'service-only' },
    { name: 'ai', prefix: 'ai', type: 'service-only' }
];

for (const mod of modulesConfig) {
    const dir = path.join('src/modules', mod.name);
    if (!fs.existsSync(dir)) continue;

    const createService = () => fs.writeFileSync(path.join(dir, `${mod.prefix}.service.ts`), `export class ${mod.prefix.charAt(0).toUpperCase() + mod.prefix.slice(1)}Service {\n    // Scaffolded business logic layer for ${mod.name}\n}\n`);
    const createRepo = () => fs.writeFileSync(path.join(dir, `${mod.prefix}.repository.ts`), `export class ${mod.prefix.charAt(0).toUpperCase() + mod.prefix.slice(1)}Repository {\n    // Scaffolded DB interactions for ${mod.name}\n}\n`);
    const createVal = () => fs.writeFileSync(path.join(dir, `${mod.prefix}.validation.ts`), `import { z } from 'zod';\n\nexport const ${mod.prefix.charAt(0).toUpperCase() + mod.prefix.slice(1)}Validation = {\n    // Zod validation schemas for ${mod.name}\n};\n`);

    if (mod.type === 'full') {
        createService(); createRepo(); createVal();
    } else if (mod.type === 'no-validation') {
        createService(); createRepo();
    } else if (mod.type === 'service-only') {
        createService();
    }
}
console.log('Scaffolding complete.');
