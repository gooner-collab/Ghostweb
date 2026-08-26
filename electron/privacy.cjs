const levels = new Set(['standard', 'balanced', 'strict']);
const normalizedUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
let currentLevel = 'standard';
let defaultUserAgent;
let documentScriptKey;

function getLevel() {
  return currentLevel;
}

async function configureSession(browserSession, level) {
  if (!levels.has(level)) throw new Error('Invalid privacy level');
  if (!defaultUserAgent) defaultUserAgent = await browserSession.getUserAgent();
  currentLevel = level;
  browserSession.setUserAgent(level === 'standard' ? defaultUserAgent : normalizedUserAgent);
  if (documentScriptKey) await browserSession.removeScriptToExecuteOnNewDocument(documentScriptKey);
  const script = getInjectionScript(level);
  documentScriptKey = script
    ? await browserSession.addScriptToExecuteOnNewDocument(`if (location.protocol === 'http:' || location.protocol === 'https:') { ${script} }`)
    : undefined;
  return currentLevel;
}

function getInjectionScript(level) {
  if (level === 'standard') return '';
  const strict = level === 'strict';
  return `(() => {
    const block = (name) => { Object.defineProperty(window, name, { configurable: false, get: () => undefined }); };
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    ${strict ? "HTMLCanvasElement.prototype.toDataURL = () => { throw new DOMException('Canvas access requires permission', 'SecurityError'); }; CanvasRenderingContext2D.prototype.getImageData = () => { throw new DOMException('Canvas access requires permission', 'SecurityError'); };" : "CanvasRenderingContext2D.prototype.getImageData = function (...args) { const image = originalGetImageData.apply(this, args); for (let i = 0; i < image.data.length; i += 4) image.data[i] = Math.max(0, Math.min(255, image.data[i] + 1)); return image; };"}
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { if (${strict} && (type === 'webgl' || type === 'webgl2')) return null; return originalGetContext.call(this, type, ...args); };
    ${strict ? "block('OfflineAudioContext'); block('AudioContext');" : "const originalChannelData = AudioBuffer.prototype.getChannelData; AudioBuffer.prototype.getChannelData = function (...args) { const data = originalChannelData.apply(this, args); for (let i = 0; i < data.length; i += 100) data[i] += 0.00001; return data; };"}
  })();`;
}

function isWebPage(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

module.exports = { getLevel, configureSession, getInjectionScript, isWebPage };
