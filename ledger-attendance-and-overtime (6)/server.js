import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const START_PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

function getNetworkIPs() {
  const ips = [];
  const interfaces = os.networkInterfaces();
  for (const ifaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[ifaceName] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ iface: ifaceName, address: iface.address });
      }
    }
  }
  return ips;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
};

function createServer() {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url?.split('?')[0] || '/');

    if (reqPath === '/' || reqPath === '/index.html' || reqPath === '/app.html') {
      const appHtmlPath = path.join(__dirname, 'app.html');
      const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
      const targetHtml = fs.existsSync(appHtmlPath) ? appHtmlPath : distHtmlPath;

      fs.readFile(targetHtml, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading application');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(data);
      });
      return;
    }

    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, safePath);

    if (!fs.existsSync(filePath)) {
      const inDist = path.join(__dirname, 'dist', safePath);
      if (fs.existsSync(inDist)) {
        filePath = inDist;
      }
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        const appHtmlPath = path.join(__dirname, 'app.html');
        if (fs.existsSync(appHtmlPath)) {
          fs.readFile(appHtmlPath, (readErr, data) => {
            if (readErr) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('404 Not Found');
              return;
            }
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(data);
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });
}

function startListening(port) {
  const server = createServer();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startListening(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, HOST, () => {
    const ips = getNetworkIPs();
    try {
      const info = {
        port: port,
        primaryIp: ips.length > 0 ? ips[0].address : '127.0.0.1',
        ips: ips.map((i) => i.address),
      };
      fs.writeFileSync(path.join(__dirname, '.active_port'), String(port), 'utf8');
      fs.writeFileSync(path.join(__dirname, '.network_info.json'), JSON.stringify(info, null, 2), 'utf8');
    } catch (e) {}

    console.log('====================================================================');
    console.log('  Wadi Degla Clubs - Attendance and Overtime Tracker');
    console.log('  Server is ACTIVE and accessible across your network!');
    console.log('');
    console.log(`  > Local URL (This PC):`);
    console.log(`    http://localhost:${port}`);
    console.log('');
    if (ips.length > 0) {
      console.log(`  > Network Share URL (Share with ANYONE on your Wi-Fi / LAN):`);
      for (const ip of ips) {
        console.log(`    http://${ip.address}:${port}  (${ip.iface})`);
      }
    }
    console.log('====================================================================');
  });
}

startListening(START_PORT);
