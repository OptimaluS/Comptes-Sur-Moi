const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const now = new Date();
const buildDate = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
pkg.buildDate = buildDate;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Build date updated:', buildDate);
