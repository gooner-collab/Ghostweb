import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Download,
  EyeOff,
  Fingerprint,
  Globe2,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';

type View = 'overview' | 'downloads' | 'mail';
type SessionState = 'active' | 'terminated' | 'unavailable';
type PrivacyLevel = 'standard' | 'balanced' | 'strict';

const navItems: { id: View; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'overview', label: 'Privacy dashboard', icon: ShieldCheck },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'mail', label: 'Private mail', icon: Mail },
];

function StatusPill({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'warning' | 'good' }) {
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{children}</span>;
}

function App() {
  const [view, setView] = useState<View>('overview');
  const [url, setUrl] = useState('ghostweb://dashboard');
  const [activeTab, setActiveTab] = useState('New tab');
  const [notice, setNotice] = useState('');
  const [sessionState, setSessionState] = useState<SessionState>('unavailable');
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<GhostwebDownload[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('standard');
  const [mailState, setMailState] = useState<{ aliases: GhostwebAlias[]; mailboxes: GhostwebMailbox[] }>({ aliases: [], mailboxes: [] });
  const [networkState, setNetworkState] = useState<GhostwebNetworkStatus>({ status: 'error', message: 'Privacy network not implemented' });
  const [networkRoute, setNetworkRoute] = useState<GhostwebRoute>({ entryNode: null, exitCountry: null, hopCount: 0 });

  useEffect(() => {
    if (!window.ghostweb?.session || !window.ghostweb?.downloads) return;
    window.ghostweb.session.getStatus().then((status) => {
      setSessionState(status.state);
      setSessionStartedAt(status.startedAt ?? null);
    });
    window.ghostweb.downloads.list().then(setDownloads);
    window.ghostweb.privacy.getLevel().then(setPrivacyLevel);
    window.ghostweb.mail.list().then(setMailState);
    window.ghostweb.network.status().then(setNetworkState);
    window.ghostweb.network.route().then(setNetworkRoute);
    return window.ghostweb.downloads.onUpdate(setDownloads);
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const handleAddressSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setActiveTab(trimmedUrl.replace(/^https?:\/\//, '').split('/')[0]);
    showNotice('Web navigation is not implemented in this prototype.');
  };

  const endSession = async () => {
    if (!window.ghostweb?.session) {
      showNotice('Session controls are available in the Electron app preview.');
      return;
    }
    const status = await window.ghostweb.session.end();
    setSessionState(status.state);
    setSessionStartedAt(null);
    showNotice('Session ended. Temporary storage was cleared.');
  };

  const changePrivacyLevel = async () => {
    if (!window.ghostweb?.privacy) {
      showNotice('Privacy controls are available in the Electron app preview.');
      return;
    }
    const levels: PrivacyLevel[] = ['standard', 'balanced', 'strict'];
    const nextLevel = levels[(levels.indexOf(privacyLevel) + 1) % levels.length];
    setPrivacyLevel(await window.ghostweb.privacy.setLevel(nextLevel));
    showNotice(`Privacy level changed to ${nextLevel}. WebRTC IP leak prevention is active; other controls are not implemented.`);
  };

  const createAlias = async () => {
    if (!window.ghostweb?.mail) return showNotice('Mail controls are available in the Electron app preview.');
    const alias = await window.ghostweb.mail.createAlias();
    setMailState((current) => ({ ...current, aliases: [...current.aliases, alias] }));
    showNotice('Alias created. Delivery remains DEV_MOCK.');
  };

  const createMailbox = async () => {
    if (!window.ghostweb?.mail) return showNotice('Mail controls are available in the Electron app preview.');
    const mailbox = await window.ghostweb.mail.createMailbox(60);
    setMailState((current) => ({ ...current, mailboxes: [...current.mailboxes, mailbox] }));
    showNotice('Temporary mailbox created for 60 minutes.');
  };

  const connectNetwork = async () => {
    if (!window.ghostweb?.network) return showNotice('Network controls are available in the Electron app preview.');
    const nextState = networkState.status === 'connected'
      ? await window.ghostweb.network.disconnect()
      : await window.ghostweb.network.connect();
    setNetworkState(nextState);
    setNetworkRoute(await window.ghostweb.network.route());
    showNotice(nextState.status === 'connected' ? 'Tor route connected through arti.' : nextState.message ?? 'Privacy network unavailable.');
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><EyeOff size={19} strokeWidth={2.5} /></div>
          <div><strong>ghostweb</strong><span>private by design</span></div>
        </div>

        <div className={`session-card ${sessionState === 'terminated' ? 'terminated' : ''}`}>
          <div className="session-card-top"><span className="live-dot" /> {sessionState === 'active' ? 'Fresh session' : sessionState === 'terminated' ? 'Session ended' : 'Browser preview'}</div>
          <div className="session-time">{sessionStartedAt ? formatElapsed(sessionStartedAt) : '--:--:--'}</div>
          <span className="session-copy">{sessionState === 'active' ? 'Temporary profile active' : sessionState === 'terminated' ? 'Temporary profile removed' : 'Electron bridge unavailable'}</span>
          {sessionState === 'active' && <button className="end-session" onClick={endSession}> <Trash2 size={14} /> End session</button>}
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button className={`nav-item ${view === id ? 'selected' : ''}`} key={id} onClick={() => setView(id)}>
              <Icon size={17} />{label}{id === 'downloads' && <span className="nav-count">{downloads.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <button className="network-status" onClick={connectNetwork}>
            {networkState.status === 'connected' ? <Globe2 size={17} /> : <WifiOff size={17} />}<span><b>Privacy network</b><small>{networkState.status === 'connected' ? 'Connected via arti' : networkState.status === 'connecting' ? 'Connecting...' : networkState.message ?? 'Not connected'}</small></span><ChevronDown size={14} className="chevron" />
          </button>
          <button className="settings-link" onClick={changePrivacyLevel}><MoreHorizontal size={17} /> Privacy level: {privacyLevel}</button>
          <div className="build-label">BUILD 0.1.0 · DEV PROTOTYPE</div>
        </div>
      </aside>

      <section className="workspace">
        <header className="browser-chrome">
          <div className="window-controls" aria-hidden="true"><span /><span /><span /></div>
          <div className="tabs-row">
            <button className="browser-tab active"><EyeOff size={14} />{activeTab}<X size={13} /></button>
            <button className="new-tab" onClick={() => { setActiveTab('New tab'); setUrl('ghostweb://dashboard'); }} aria-label="New tab"><Plus size={16} /></button>
          </div>
          <div className="address-row">
            <button className="chrome-button" aria-label="Go back"><ArrowLeft size={16} /></button>
            <button className="chrome-button disabled" aria-label="Go forward"><ArrowRight size={16} /></button>
            <button className="chrome-button" aria-label="Reload" onClick={() => showNotice('Page reloaded from the temporary session.')}><RefreshCw size={15} /></button>
            <form className="address-bar" onSubmit={handleAddressSubmit}>
              <LockKeyhole size={14} className="address-lock" />
              <input aria-label="Address" value={url} onChange={(event) => setUrl(event.target.value)} />
              <Fingerprint size={15} className="address-fingerprint" />
            </form>
            <button className="chrome-button" aria-label="Open menu"><MoreHorizontal size={17} /></button>
          </div>
        </header>

        <div className="page-content">
          {view === 'overview' && <Dashboard onAction={showNotice} sessionState={sessionState} downloadCount={downloads.length} privacyLevel={privacyLevel} networkState={networkState} networkRoute={networkRoute} />}
          {view === 'downloads' && <Downloads onAction={showNotice} downloads={downloads} />}
          {view === 'mail' && <PrivateMail onAction={showNotice} mailState={mailState} onCreateAlias={createAlias} onCreateMailbox={createMailbox} />}
        </div>
        {notice && <div className="toast"><CircleAlert size={16} />{notice}</div>}
      </section>
    </main>
  );
}

function Dashboard({ onAction, sessionState, downloadCount, privacyLevel, networkState, networkRoute }: { onAction: (message: string) => void; sessionState: SessionState; downloadCount: number; privacyLevel: PrivacyLevel; networkState: GhostwebNetworkStatus; networkRoute: GhostwebRoute }) {
  return <div className="dashboard fade-in">
    <div className="page-heading">
      <div><span className="eyebrow">SESSION OVERVIEW</span><h1>Good morning, Alex.</h1><p>Your browsing space is temporary and intentionally quiet.</p></div>
      <button className="outline-button" onClick={() => onAction('A new temporary session is not implemented yet.')}><Plus size={15} /> New session</button>
    </div>

    <div className={`hero-status ${sessionState !== 'active' ? 'terminated-status' : ''}`}>
      <div className="hero-icon"><ShieldCheck size={25} /></div>
      <div><strong>{sessionState === 'active' ? 'Your local footprint is minimized' : sessionState === 'terminated' ? 'This session has ended' : 'Desktop session unavailable'}</strong><span>{sessionState === 'active' ? 'Persistent history and cookies are disabled for this session.' : sessionState === 'terminated' ? 'Temporary storage has been cleared from the app session.' : 'Open the Electron app to inspect the real temporary profile state.'}</span></div>
      <StatusPill tone={sessionState === 'active' ? 'good' : 'muted'}>{sessionState === 'active' ? 'Active' : sessionState === 'terminated' ? 'Terminated' : 'Preview'}</StatusPill>
    </div>

    <div className="content-grid">
      <section className="panel posture-panel">
        <div className="panel-heading"><div><span className="eyebrow">PRIVACY POSTURE</span><h2>What is happening now</h2></div><Sparkles size={17} className="panel-icon" /></div>
        <div className="posture-list">
          <PostureRow icon={<Fingerprint />} label="Fingerprint resistance" value={privacyLevel[0].toUpperCase() + privacyLevel.slice(1)} action="Adjust" onClick={() => onAction('Fingerprint controls are available in Settings.')} />
          <PostureRow icon={<Globe2 />} label="Privacy network" value={networkState.status === 'connected' ? `Connected · ${networkRoute.hopCount} hops` : networkState.message ?? 'Not connected'} action={networkState.status === 'connected' ? 'Test' : 'Connect'} warning={networkState.status !== 'connected'} onClick={() => onAction(networkState.status === 'connected' ? 'Connection test is available from the network control.' : networkState.message ?? 'Privacy network unavailable.')} />
          <PostureRow icon={<ScanLine />} label="Download protection" value="Quarantine ready" action="Open" onClick={() => onAction('Download scanning is not implemented yet.')} />
        </div>
      </section>

      <section className="panel facts-panel">
        <div className="panel-heading"><div><span className="eyebrow">SESSION FACTS</span><h2>Clean by default</h2></div><LockKeyhole size={17} className="panel-icon" /></div>
        <div className="fact-grid"><Fact label="Session" value={sessionState === 'active' ? 'Active' : sessionState === 'terminated' ? 'Terminated' : 'Unavailable'} good={sessionState === 'active'} /><Fact label="Temporary profile" value={sessionState === 'active' ? 'Active' : sessionState === 'terminated' ? 'Removed' : 'Unavailable'} good={sessionState === 'active'} /><Fact label="Persistent history" value="Disabled" good /><Fact label="Persistent cookies" value="Disabled" good /><Fact label="Local storage" value="Temporary" /><Fact label="Downloads" value={`${downloadCount} this session`} /><Fact label="Network" value={networkState.status === 'connected' ? 'Connected' : networkState.status === 'error' ? 'Not implemented' : networkState.status} /><Fact label="Route" value={networkState.status === 'connected' ? `${networkRoute.hopCount} hops via ${networkRoute.exitCountry ?? 'automatic exit'}` : 'Not connected'} /><Fact label="Trackers blocked" value="Not implemented" /><Fact label="Private email" value="None" /></div>
        <div className="facts-footer"><Check size={14} /> Cleared when this session ends</div>
      </section>
    </div>

    <section className="honesty-section"><div className="honesty-intro"><span className="eyebrow">A CLEARER MODEL</span><h2>Privacy is separation,<br />not invisibility.</h2><p>Tor integration will route traffic through a multi-hop relay path. Ghostweb will always show what is and is not active.</p><button className="text-button" onClick={() => onAction('The full privacy model will be available in the documentation.')}>Read the privacy model <ArrowRight size={14} /></button></div><div className="route-diagram"><RouteNode label="You" sub="Entry relay sees your IP" /><div className="route-line" /><RouteNode label="Middle" sub="Passes encrypted traffic" /><div className="route-line" /><RouteNode label="Website" sub="Exit sees destination" last /></div></section>
    <div className="disclaimer"><CircleAlert size={15} /><span><b>Prototype honesty:</b> Tor routing, tracker blocking, mail delivery, and antivirus scanning are not implemented. No security state is simulated.</span></div>
  </div>;
}

function PostureRow({ icon, label, value, action, warning, onClick }: { icon: React.ReactNode; label: string; value: string; action: string; warning?: boolean; onClick: () => void }) {
  return <div className="posture-row"><div className="row-icon">{icon}</div><div className="row-label"><b>{label}</b><span className={warning ? 'warning-text' : ''}>{value}</span></div><button className="row-action" onClick={onClick}>{action}</button></div>;
}

function Fact({ label, value, good = false }: { label: string; value: string; good?: boolean }) { return <div className="fact"><span>{label}</span><b className={good ? 'good-text' : ''}>{good && <Check size={13} />}{value}</b></div>; }
function RouteNode({ label, sub, last = false }: { label: string; sub: string; last?: boolean }) { return <div className={`route-node ${last ? 'last' : ''}`}><div className="route-dot" /><b>{label}</b><span>{sub}</span></div>; }

function formatElapsed(startedAt: number) {
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function Downloads({ onAction, downloads }: { onAction: (message: string) => void; downloads: GhostwebDownload[] }) { return <SimpleView icon={<Download />} eyebrow="DOWNLOADS" title="Nothing opened automatically." description="Files are held in quarantine until a scan completes and you make an explicit decision." action="Choose a file" onAction={() => onAction('Downloads begin from web navigation.')} actionIcon={<Plus size={15} />}>{downloads.length === 0 ? <div className="empty-state"><ScanLine size={27} /><span>No downloads in this session</span><small>Quarantine and local heuristic scan ready</small></div> : <div className="download-list">{downloads.map((download) => <div className="download-item" key={download.id}><div className="download-item-icon"><Download size={17} /></div><div className="download-item-copy"><b>{download.filename}</b><span>{download.message ?? (download.state === 'downloading' ? 'Downloading...' : 'Scanning...')}</span>{download.hash && <small>SHA-256 {download.hash.slice(0, 16)}...</small>}</div><StatusPill tone={download.riskLevel === 'no_known_threat' ? 'good' : download.riskLevel === 'scanning' ? 'muted' : 'warning'}>{download.riskLevel === 'no_known_threat' ? 'No known threat' : download.riskLevel}</StatusPill></div>)}</div>}</SimpleView>; }
function PrivateMail({ onAction, mailState, onCreateAlias, onCreateMailbox }: { onAction: (message: string) => void; mailState: { aliases: GhostwebAlias[]; mailboxes: GhostwebMailbox[] }; onCreateAlias: () => void; onCreateMailbox: () => void }) { return <SimpleView icon={<Mail />} eyebrow="PRIVATE MAIL" title="Aliases without the noise." description="Create disposable aliases and temporary mailboxes. Delivery is marked as a development mock until a provider is connected." action="Create alias" onAction={onCreateAlias} actionIcon={<Plus size={15} />}><div className="mail-mock"><div className="mail-mock-icon"><Mail size={20} /></div><div><b>DEV_MOCK · Delivery service</b><span>Alias and mailbox lifecycle is real; message delivery is not implemented.</span></div><StatusPill tone="warning">Not implemented</StatusPill></div><div className="mail-actions"><button className="outline-button" onClick={onCreateMailbox}><Plus size={15} /> Temporary mailbox · 60 min</button></div>{mailState.aliases.map((alias) => <div className="mail-record" key={alias.id}><Mail size={15} /><span>{alias.address}</span><StatusPill tone="good">Active alias</StatusPill></div>)}{mailState.mailboxes.map((mailbox) => <div className="mail-record" key={mailbox.id}><Mail size={15} /><span>{mailbox.address}</span><StatusPill tone="warning">Expires {new Date(mailbox.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</StatusPill></div>)}</SimpleView>; }
function SimpleView({ icon, eyebrow, title, description, action, onAction, actionIcon, children }: { icon: React.ReactNode; eyebrow: string; title: string; description: string; action: string; onAction: () => void; actionIcon: React.ReactNode; children: React.ReactNode }) { return <div className="simple-view fade-in"><div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><button className="outline-button" onClick={onAction}>{actionIcon}{action}</button></div><div className="simple-icon">{icon}</div>{children}</div>; }

export default App;
