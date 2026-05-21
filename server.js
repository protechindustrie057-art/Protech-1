// server.js
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, (err) => {
      if (err) {
        console.error('❌ Erreur au démarrage:', err);
        process.exit(1);
      }
      console.log('========================================');
      console.log('   SK Parfumerie est démarré !');
      console.log('========================================');
      console.log(`👉 http://localhost:${port}`);
      console.log('========================================');
      console.log('Pour arrêter : Ctrl+C');
    });
  })
  .catch((err) => {
    console.error('❌ Erreur lors de la préparation:', err);
    process.exit(1);
  });