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

function getPrefixToSrc(filePath) {
    const rel = path.relative('./src', path.dirname(filePath));
    if (rel === '' || rel === '.') return './';
    const depth = rel.split(path.sep).length;
    return '../'.repeat(depth);
}

walkDir('./src', (filePath) => {
    if (!filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const prefix = getPrefixToSrc(filePath);

    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/infrastructure\/(.*)['"]/g, "'" + prefix + "infrastructure/$1'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/shared\/(.*)['"]/g, "'" + prefix + "shared/$1'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/core\/(.*)['"]/g, "'" + prefix + "core/$1'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/api\/(.*)['"]/g, "'" + prefix + "api/$1'");

    // Reverse out some other bad depth rules if they exist
    content = content.replace(/['"]\.\.\/\.\.\/environments['"]/g, "'" + prefix + "shared/config/environments'");
    content = content.replace(/['"]\.\.\/\.\.\/characters\/schema['"]/g, "'" + prefix + "core/characters/schema'");
    content = content.replace(/['"]\.\.\/characters\/schema['"]/g, "'" + prefix + "core/characters/schema'");

    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/\.\.\/api\/middlewares\/auth['"]/g, "'" + prefix + "api/middlewares/auth'");
    content = content.replace(/['"]\.\.\/\.\.\/\.\.\/api\/middlewares\/auth['"]/g, "'" + prefix + "api/middlewares/auth'");

    content = content.replace(/edgeDocs\.forEach\(e => \{/g, "edgeDocs.forEach((e: any) => {");
    content = content.replace(/nodes\.filter\(n =>/g, "nodes.filter((n: any) =>");
    content = content.replace(/\.filter\(e =>/g, ".filter((e: any) =>");
    content = content.replace(/\.map\(e =>/g, ".map((e: any) =>");
    content = content.replace(/\.find\(n =>/g, ".find((n: any) =>");
    content = content.replace(/\.find\(t =>/g, ".find((t: any) =>");
    content = content.replace(/nodes\.some\(n =>/g, "nodes.some((n: any) =>");
    content = content.replace(/chatHistory\.map\(m =>/g, "chatHistory.map((m: any) =>");
    content = content.replace(/agents\.reduce\(\(s, a\) =>/g, "agents.reduce((s: number, a: any) =>");
    content = content.replace(/purchases\.reduce\(\(s, p\) =>/g, "purchases.reduce((s: number, p: any) =>");
    content = content.replace(/purchases\.filter\(p =>/g, "purchases.filter((p: any) =>");
    content = content.replace(/agents\.map\(a =>/g, "agents.map((a: any) =>");
    content = content.replace(/\.filter\(r =>/g, ".filter((r: any) =>");
    content = content.replace(/reviews\.reduce\(\(s, r\) =>/g, "reviews.reduce((s: number, r: any) =>");
    content = content.replace(/wallets\.forEach\(w =>/g, "wallets.forEach((w: any) =>");
    content = content.replace(/ratings\.reduce\(\(s, r\) =>/g, "ratings.reduce((s: number, r: any) =>");
    content = content.replace(/reviews\.map\(r =>/g, "reviews.map((r: any) =>");
    content = content.replace(/allowedIPs\.some\(\(ip\) =>/g, "allowedIPs.some((ip: string) =>");
    content = content.replace(/allowedDomains\.some\(\(d\) =>/g, "allowedDomains.some((d: string) =>");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
});
