const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (['node_modules', '.next', '.next-dev', 'dist', '.git'].includes(file)) continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  } catch(e){}
  return results;
}

const files = walk('nextops-backend').concat(walk('nextops-frontend'));

console.log('=== AUDIT REPORT ===');
console.log('Total non-generated TS/TSX files scanned:', files.length);

let anyList = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    
    // Check type annotations or casting with any
    const anyMatches = [
      /:[ \t]*any\b/,
      /\bas[ \t]+any\b/,
      /<[ \t]*any[ \t]*>/,
      /\bany\[\]/,
      /Array<[ \t]*any[ \t]*>/,
      /Record<[^,]+,[ \t]*any\b/,
      /Promise<[ \t]*any\b/
    ];

    if (anyMatches.some(rx => rx.test(trimmed))) {
      anyList.push({ file, line: idx + 1, code: trimmed });
    }
  });
});

console.log('\n--- 1. ANY USAGES FOUND IN TS CODE ---');
if (anyList.length === 0) {
  console.log('NONE! No explicit "any" types found in TypeScript application source code.');
} else {
  anyList.forEach(item => {
    console.log(`${item.file}:${item.line}: ${item.code}`);
  });
}

console.log('\n--- 2. PRISMA SCHEMA USERAIBUDGET AUDIT ---');
const schemaPath = 'nextops-backend/src/prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const lines = schemaContent.split('\n');
  let inModel = false;
  lines.forEach((line, idx) => {
    if (line.includes('model UserAiBudget')) inModel = true;
    if (inModel && line.includes('}')) inModel = false;
    if (inModel) {
      console.log(`${schemaPath}:${idx + 1}: ${line}`);
    }
  });
}

console.log('\n--- 3. USERAIBUDGET CODE REFERENCES (DTOs, Services, Frontend) ---');
const budgetRelatedFiles = files.filter(f => f.toLowerCase().includes('budget') || f.toLowerCase().includes('agentknowledgebase'));
budgetRelatedFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('float') || line.toLowerCase().includes('monthlylimit') || line.toLowerCase().includes('currentusage') || line.toLowerCase().includes('useraibudget')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});


