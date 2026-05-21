// scripts/prepare-release.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const releaseDir = path.join(__dirname, '..', 'release');

console.log('📦 Préparation du dossier release...');

// Supprimer l'ancien dossier release
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}

// Créer le dossier release
fs.mkdirSync(releaseDir, { recursive: true });

// Copier les fichiers nécessaires
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'next.config.mjs',
  'server.js',
  'run-app.bat',
  '.env.local.example',
  'README.md'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(releaseDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✅ Copié: ${file}`);
  } else {
    console.log(`  ⚠️ Fichier manquant: ${file}`);
  }
});

// Copier le dossier .next
const nextDir = path.join(__dirname, '..', '.next');
const releaseNextDir = path.join(releaseDir, '.next');
if (fs.existsSync(nextDir)) {
  fs.cpSync(nextDir, releaseNextDir, { recursive: true });
  console.log('  ✅ Copié: .next/');
}

// Copier le dossier public
const publicDir = path.join(__dirname, '..', 'public');
const releasePublicDir = path.join(releaseDir, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, releasePublicDir, { recursive: true });
  console.log('  ✅ Copié: public/');
}

console.log('\n✅ Dossier release prêt !');
console.log(`📁 Emplacement: ${releaseDir}`);