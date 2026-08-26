const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

// Local, offline-first scanner. It is deliberately conservative: a positive rule
// moves the file to quarantine and the browser never executes a download itself.
const dangerousExtensions = new Set([
  '.exe','.scr','.com','.pif','.msi','.msp','.bat','.cmd','.ps1','.vbs','.vbe','.js','.jse',
  '.wsf','.wsh','.hta','.dll','.cpl','.ocx','.sys','.lnk','.jar','.iso'
]);
const macroExtensions = new Set(['.docm','.dotm','.xlsm','.xltm','.pptm','.potm']);
const archiveExtensions = new Set(['.zip','.rar','.7z','.iso','.tar','.gz','.bz2']);

const signatures = [
  { name:'EICAR-Test-File', bytes:Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*','ascii'), risk:'malicious' },
  { name:'Windows PE executable', bytes:Buffer.from('MZ','ascii'), risk:'suspicious' },
];

function sha256(file) {
  return new Promise((resolve,reject)=>{
    const h=crypto.createHash('sha256'); const s=fsSync.createReadStream(file);
    s.on('data',c=>h.update(c)); s.on('error',reject); s.on('end',()=>resolve(h.digest('hex')));
  });
}
async function readHead(file, max=1024*1024){ const h=await fs.open(file,'r'); try { const b=Buffer.alloc(max); const {bytesRead}=await h.read(b,0,max,0); return b.subarray(0,bytesRead); } finally { await h.close(); } }
function extension(file){ return path.extname(file).toLowerCase(); }
function suspiciousDoubleExtension(file){ const n=path.basename(file).toLowerCase(); return /\.(pdf|jpg|jpeg|png|txt|doc|docx|xls|xlsx|zip)\.(exe|scr|com|bat|cmd|js|vbs|hta|msi)$/.test(n); }
async function runClamAV(file){
  const candidates=process.platform==='win32'?['clamscan.exe','clamscan']:['clamscan'];
  for(const command of candidates){
    const result=await new Promise(resolve=>{ const p=spawn(command,['--no-summary',file],{windowsHide:true}); let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('error',()=>resolve(null));p.on('close',code=>resolve({code,out})); });
    if(!result) continue;
    if(result.code===1) return {available:true,detected:true,message:result.out.trim()||'ClamAV detected a threat'};
    if(result.code===0) return {available:true,detected:false,message:'ClamAV scan clean'};
    return {available:true,detected:false,message:'ClamAV could not complete the scan'};
  }
  return {available:false,detected:false,message:'ClamAV is not installed; local engine used'};
}
async function scanFile(file){
  const hash=await sha256(file); const stat=await fs.stat(file); const ext=extension(file); const head=await readHead(file);
  const findings=[];
  if(stat.size===0) findings.push('Empty file');
  if(suspiciousDoubleExtension(file)) findings.push('Double-extension masquerading');
  if(dangerousExtensions.has(ext)) findings.push('Executable/script file type');
  if(macroExtensions.has(ext)) findings.push('Macro-enabled document');
  if(archiveExtensions.has(ext) && stat.size>500*1024*1024) findings.push('Large archive requires manual review');
  for(const sig of signatures){ if(head.includes(sig.bytes)) findings.push(sig.name); }
  const clam=await runClamAV(file);
  if(clam.detected) findings.push(clam.message);
  let risk='no_known_threat';
  if(findings.some(x=>x.includes('EICAR')||x.includes('ClamAV'))) risk='malicious';
  else if(findings.length) risk='suspicious';
  return {hash,riskLevel:risk,findings,scanner:'Ghostweb Local AV Engine',clamav:clam.available,message:findings.length?findings.join('; '):clam.message};
}
module.exports={scanFile,sha256,dangerousExtensions};
