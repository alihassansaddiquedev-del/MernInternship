import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relativePath = urlPath === '/' ? 'index.html' : normalize(urlPath).replace(/^([/\\])+/, '');
  try {
    const content = await readFile(join(root, relativePath));
    response.writeHead(200, { 'content-type': types[extname(relativePath)] ?? 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(4173, () => console.log('Dashboard available at http://localhost:4173'));
