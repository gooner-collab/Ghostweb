const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const network = require('../electron/network.cjs');

const root = path.join(__dirname, '..');

test('network never reports connected before a real proxy is ready', async () => {
  assert.notEqual(network.getStatus().status, 'connected');
  assert.deepEqual(network.getCurrentRoute(), { entryNode: null, exitCountry: null, hopCount: 0 });
  assert.equal((await network.testConnection()).connected, false);
});

test('preload exposes only the vetted Ghostweb bridge', () => {
  const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
  assert.match(preload, /contextBridge\.exposeInMainWorld\('ghostweb'/);
  assert.doesNotMatch(preload, /process\.|nodeIntegration|contextIsolation\s*:\s*false/);
  assert.match(preload, /network:/);
});

test('renderer CSP blocks objects and inline scripts', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /script-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /frame-ancestors 'none'/);
});
