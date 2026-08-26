const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');

const dangerousExtensions = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.scr', '.dll', '.com', '.hta',
  '.docm', '.dotm', '.xlsm', '.xltm', '.pptm', '.potm',
]);
const archiveExtensions = new Set(['.zip', '.rar', '.7z', '.iso']);

async function calculateHash(filePath) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

function getExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

async function classifyFile(filePath) {
  const extension = getExtension(filePath);
  if (dangerousExtensions.has(extension)) return 'blocked';
  if (archiveExtensions.has(extension)) return 'suspicious';

  try {
    await fsp.access(filePath, fs.constants.R_OK);
    return 'no_known_threat';
  } catch {
    return 'unable_to_scan';
  }
}

async function scanFile(filePath) {
  try {
    const hash = await calculateHash(filePath);
    const riskLevel = await classifyFile(filePath);
    return {
      hash,
      riskLevel,
      message: riskLevel === 'unable_to_scan'
        ? 'Unable to fully scan this file'
        : 'Local heuristic check complete; antivirus scanning is not implemented',
    };
  } catch {
    return {
      hash: null,
      riskLevel: 'unable_to_scan',
      message: 'Unable to fully scan this file',
    };
  }
}

module.exports = { dangerousExtensions, calculateHash, classifyFile, scanFile };
