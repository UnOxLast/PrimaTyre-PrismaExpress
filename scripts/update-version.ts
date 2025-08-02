import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca package.json untuk version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Generate timestamp saat ini
const now = new Date();
const dateFormatted = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
}).replace(/\//g, '-');

const timeFormatted = now.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

// Buat version info
const versionInfo = {
    version: version,
    date: dateFormatted,
    time: `${timeFormatted} WIB`,
    buildNumber: Date.now(),
    description: 'PrimaTyre API Server',
    updatedAt: `${dateFormatted} time: ${timeFormatted} WIB`
};

// Write ke file JSON
const versionPath = path.join(__dirname, '../src/version-info.json');
fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

console.log(`✅ Version updated: ${version}`);
console.log(`📅 Date: ${dateFormatted}`);
console.log(`⏰ Time: ${timeFormatted} WIB`);
console.log(`📝 Build number: ${versionInfo.buildNumber}`);
