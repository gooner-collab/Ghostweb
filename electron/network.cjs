const net = require('node:net');
const { spawn } = require('node:child_process');

const proxyHost = '127.0.0.1';
const proxyPort = 9150;
let artiProcess;
let status = 'disconnected';
let errorMessage = null;
let exitCountry;

function getStatus() {
  return { status, message: errorMessage };
}

function getCurrentRoute() {
  return { entryNode: status === 'connected' ? 'Tor entry relay' : null, exitCountry: exitCountry ?? null, hopCount: status === 'connected' ? 3 : 0 };
}

function waitForProxy(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const socket = net.createConnection({ host: proxyHost, port: proxyPort });
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) reject(new Error('arti proxy did not become ready'));
        else setTimeout(check, 200);
      });
    };
    check();
  });
}

async function connect(browserSession) {
  if (status === 'connected') return getStatus();
  status = 'connecting';
  errorMessage = null;
  try {
    artiProcess = spawn('arti', ['proxy', '-p', String(proxyPort)], { stdio: 'ignore' });
    artiProcess.once('error', () => {
      status = 'error';
      errorMessage = 'Privacy network not implemented';
    });
    await waitForProxy();
    await browserSession.setProxy({ proxyRules: `socks5://${proxyHost}:${proxyPort}` });
    status = 'connected';
    return getStatus();
  } catch {
    if (artiProcess) artiProcess.kill();
    artiProcess = undefined;
    status = 'error';
    errorMessage = 'Privacy network not implemented';
    return getStatus();
  }
}

async function disconnect(browserSession) {
  await browserSession.setProxy({ mode: 'direct' });
  if (artiProcess) artiProcess.kill();
  artiProcess = undefined;
  status = 'disconnected';
  errorMessage = null;
  return getStatus();
}

async function testConnection() {
  if (status !== 'connected') return { connected: false, message: errorMessage ?? 'Not connected' };
  try {
    await waitForProxy(1000);
    return { connected: true, message: 'arti proxy is reachable' };
  } catch {
    return { connected: false, message: 'Unable to test the arti proxy' };
  }
}

async function selectExitCountry(countryCode) {
  if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) throw new Error('Invalid country code');
  exitCountry = countryCode;
  return getCurrentRoute();
}

module.exports = { connect, disconnect, getStatus, getCurrentRoute, selectExitCountry, testConnection };
