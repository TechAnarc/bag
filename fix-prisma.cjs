const fs = require('fs');
const path = require('path');

function getRelativePath(fromDir, toFile) {
  let rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace('.ts', '');
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const dbConfigPath = path.resolve('backend/src/config/database.ts');
  const fileDir = path.dirname(path.resolve(file));
  const relPath = getRelativePath(fileDir, dbConfigPath);

  if (content.includes('new PrismaClient()')) {
    content = content.replace(/const prisma = new PrismaClient\(\);/g, '');
    changed = true;
  }

  if (content.includes('(prisma as any)')) {
    content = content.replace(/\(prisma as any\)/g, 'prisma');
    changed = true;
  }

  if (changed) {
    if (!content.includes('import { prisma }') && !content.includes('import prisma from')) {
      const importStatement = `import { prisma } from '${relPath}';\n`;
      content = importStatement + content;
    }
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      walk(file);
    } else {
      if (file.endsWith('.ts') && !file.includes('config\\database.ts') && !file.includes('config/database.ts')) {
        processFile(file);
      }
    }
  });
}

walk('backend/src');
