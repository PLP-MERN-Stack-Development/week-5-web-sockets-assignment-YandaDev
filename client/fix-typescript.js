#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function fixTypeScript() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');

  // Find all JSX and JS files
  const files = await glob('**/*.{js,jsx}', { cwd: srcDir });

  files.forEach(file => {
    const filePath = path.join(srcDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove type imports
    content = content.replace(/import\s*\{\s*([^}]*),\s*type\s+[^}]*\s*\}/g, 'import { $1 }');
    content = content.replace(/import\s*\{\s*type\s+[^}]*,\s*([^}]*)\s*\}/g, 'import { $1 }');
    content = content.replace(/import\s*\{\s*type\s+[^}]*\s*\}/g, '');
    
    // Remove React.forwardRef generics
    content = content.replace(/React\.forwardRef<[^>]*>/g, 'React.forwardRef');
    
    // Remove interface declarations
    content = content.replace(/^export\s+interface\s+\w+[^{]*\{[^}]*\}/gm, '');
    content = content.replace(/^interface\s+\w+[^{]*\{[^}]*\}/gm, '');
    
    // Remove type declarations
    content = content.replace(/^type\s+\w+\s*=.*$/gm, '');
    
    // Remove React type annotations from parameters
    content = content.replace(/:\s*React\.\w+<[^>]*>/g, '');
    
    // Remove standalone type parameters
    content = content.replace(/<[A-Z]\w*>/g, '');
    
    // Clean up empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  });

  console.log('TypeScript cleanup completed!');
}

fixTypeScript();
