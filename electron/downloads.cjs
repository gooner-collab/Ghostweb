const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { app } = require('electron');
const { scanFile } = require('./antivirus.cjs');

const downloads = new Map();
let quarantineDirectory;
let notify;

async function initializeDownloads(onUpdate) {
  notify=onUpdate;
  quarantineDirectory=path.join(app.getPath('temp'),'ghostweb-quarantine',randomUUID());
  await fs.mkdir(quarantineDirectory,{recursive:true});
}
function publish(){ if(notify) notify([...downloads.values()]); }
function uniquePath(filename){ return path.join(quarantineDirectory,`${randomUUID()}-${path.basename(filename)}`); }
function attachDownloadListener(browserSession){
  browserSession.on('will-download',(_event,item)=>{
    const id=randomUUID(), filename=path.basename(item.getFilename()), filePath=uniquePath(filename);
    const record={id,filename,source:item.getURL(),state:'downloading',riskLevel:'scanning',receivedBytes:0,totalBytes:item.getTotalBytes(),hash:null,message:'Scanning download with Ghostweb AV Engine'};
    item.setSavePath(filePath);downloads.set(id,record);publish();
    item.on('updated',(_e,state)=>{record.state=state==='interrupted'?'interrupted':'downloading';record.receivedBytes=item.getReceivedBytes();record.totalBytes=item.getTotalBytes();publish();});
    item.once('done',async(_e,state)=>{
      record.receivedBytes=item.getReceivedBytes();record.totalBytes=item.getTotalBytes();
      if(state!=='completed'){record.state='interrupted';record.riskLevel='unable_to_scan';record.message='Download did not complete';publish();return;}
      try{
        const result=await scanFile(filePath);record.hash=result.hash;record.riskLevel=result.riskLevel;record.message=result.message;
        if(result.riskLevel==='no_known_threat') record.state='safe'; else record.state='quarantined';
        // Safe files are still kept under Ghostweb control until the UI explicitly releases them.
      }catch(err){record.state='quarantined';record.riskLevel='unable_to_scan';record.message=`Scan failed: ${err.message}`;}
      publish();
    });
  });
}
function listDownloads(){return [...downloads.values()];}
async function clearDownloads(){downloads.clear();if(quarantineDirectory)await fs.rm(quarantineDirectory,{recursive:true,force:true});quarantineDirectory=undefined;}
module.exports={initializeDownloads,attachDownloadListener,listDownloads,clearDownloads};
