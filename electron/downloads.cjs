const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { app } = require('electron');
const { scanFile } = require('./security.cjs');

const downloads = new Map();
let quarantineDirectory;
let notify;

async function initializeDownloads(onUpdate) {
  notify = onUpdate;
  quarantineDirectory = path.join(app.getPath('temp'), 'ghostweb-quarantine', randomUUID());
  await fs.mkdir(quarantineDirectory, { recursive: true });
}

function attachDownloadListener(browserSession) {
  browserSession.on('will-download', (_event, item) => {
    const id = randomUUID();
    const filename = item.getFilename();
    const safeFilename = path.basename(filename);
    const filePath = path.join(quarantineDirectory, safeFilename);
    const record = {
      id,
      filename: safeFilename,
      source: item.getURL(),
      state: 'downloading',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      riskLevel: 'scanning',
      hash: null,
      message: null,
    };

    item.setSavePath(filePath);
    downloads.set(id, record);
    publish();

    item.on('updated', (_downloadEvent, state) => {
      record.state = state === 'interrupted' ? 'interrupted' : 'downloading';
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      publish();
    });

    item.once('done', async (_downloadEvent, state) => {
      record.state = state === 'completed' ? 'quarantined' : 'interrupted';
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      if (state === 'completed') {
        const result = await scanFile(filePath);
        record.riskLevel = result.riskLevel;
        record.hash = result.hash;
        record.message = result.message;
      } else {
        record.riskLevel = 'unable_to_scan';
        record.message = 'Unable to fully scan this file';
      }
      publish();
    });
  });
}

function listDownloads() {
  return [...downloads.values()];
}

async function clearDownloads() {
  downloads.clear();
  if (quarantineDirectory) await fs.rm(quarantineDirectory, { recursive: true, force: true });
  quarantineDirectory = undefined;
}

function publish() {
  if (notify) notify(listDownloads());
}

module.exports = { initializeDownloads, attachDownloadListener, listDownloads, clearDownloads };
