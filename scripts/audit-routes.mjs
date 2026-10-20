import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      results.push(...walk(fp));
    } else if (f === 'route.ts') {
      results.push(fp);
    }
  }
  return results;
}

const routes = walk('src/app/api');
console.log(`Total routes: ${routes.length}`);

const idRoutes = routes.filter(r => r.includes('[id]'));
console.log(`\nAnalyzing ${idRoutes.length} dynamic [id] routes for IDOR / ownership leaks:`);

for (const r of idRoutes) {
  const content = fs.readFileSync(r, 'utf8');
  // Look for patterns like findUnique({ where: { id } }) or findFirst({ where: { id } }) without userId
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('.findUnique(') || line.includes('.findFirst(') || line.includes('.update(') || line.includes('.delete(')) && !line.includes('//')) {
      const surrounding = lines.slice(idx, idx + 10).join(' ');
      if (surrounding.includes('id:') || surrounding.includes('id,')) {
        if (!surrounding.includes('userId') && !surrounding.includes('studentProfileId') && !surrounding.includes('user.id')) {
          console.log(`Potential IDOR in ${r}:${idx + 1}: ${surrounding.substring(0, 100)}...`);
        }
      }
    }
  });
}


