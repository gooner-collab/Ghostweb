const { randomUUID } = require('node:crypto');
const { session } = require('electron');

let activeSession = null;

async function createSession() {
  const partition = `ghostweb-${randomUUID()}`;
  const browserSession = session.fromPartition(partition);
  await browserSession.clearStorageData();
  await browserSession.clearCache();
  activeSession = { browserSession, partition, startedAt: Date.now() };
  return activeSession;
}

async function terminateSession() {
  if (!activeSession) return;

  await activeSession.browserSession.clearStorageData();
  await activeSession.browserSession.clearCache();
  await activeSession.browserSession.clearAuthCache();
  activeSession = null;
}

function getSessionStatus() {
  if (!activeSession) return { state: 'terminated' };
  return { state: 'active', startedAt: activeSession.startedAt };
}

function getActiveSession() {
  if (!activeSession) throw new Error('No active session');
  return activeSession.browserSession;
}

module.exports = { createSession, terminateSession, getSessionStatus, getActiveSession };
