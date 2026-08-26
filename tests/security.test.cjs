const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { dangerousExtensions, calculateHash, classifyFile, scanFile } = require('../electron/security.cjs');
const { getInjectionScript, isWebPage } = require('../electron/privacy.cjs');

test('calculates the SHA-256 hash', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ghostweb-test-'));
  const filePath = path.join(directory, 'note.txt');
  await fs.writeFile(filePath, 'ghostweb');
    assert.equal(await calculateHash(filePath), '6a938808c1cc47d6363d1f02a241e5f63bf1d67d5a4872204819bd80d03903cb');
  await fs.rm(directory, { recursive: true, force: true });
});

test('classifies every dangerous extension as blocked', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ghostweb-test-'));
  for (const extension of dangerousExtensions) {
    const filePath = path.join(directory, `download${extension}`);
    await fs.writeFile(filePath, 'test');
    assert.equal(await classifyFile(filePath), 'blocked', extension);
  }
  await fs.rm(directory, { recursive: true, force: true });
});

test('classifies executable archives as suspicious without extracting them', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ghostweb-test-'));
  const filePath = path.join(directory, 'archive.zip');
  await fs.writeFile(filePath, 'not extracted');
  assert.equal(await classifyFile(filePath), 'suspicious');
  await fs.rm(directory, { recursive: true, force: true });
});

test('reports failed scans as unable_to_scan', async () => {
  const result = await scanFile('/file/does/not/exist');
  assert.equal(result.riskLevel, 'unable_to_scan');
  assert.equal(result.message, 'Unable to fully scan this file');
});

test('keeps Standard privacy controls untouched', () => {
  assert.equal(getInjectionScript('standard'), '');
  assert.equal(isWebPage('ghostweb://dashboard'), false);
});

test('creates distinct Balanced and Strict document policies', () => {
  const balanced = getInjectionScript('balanced');
  const strict = getInjectionScript('strict');
  assert.match(balanced, /getImageData/);
  assert.match(balanced, /getChannelData/);
  assert.match(strict, /Canvas access requires permission/);
  assert.match(strict, /type === 'webgl'/);
  assert.match(strict, /OfflineAudioContext/);
  assert.equal(isWebPage('https://example.com'), true);
});
