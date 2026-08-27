const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'lib');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.functions.ts'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace optionalSupabaseAuth with requireSupabaseAuth
  content = content.replace(/optionalSupabaseAuth/g, 'requireSupabaseAuth');
  content = content.replace(/optional-auth-middleware/g, 'auth-middleware');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Reverted ${file}`);
}
