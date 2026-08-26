declare global {
  interface GhostwebSessionStatus {
    state: 'active' | 'terminated';
    startedAt?: number;
  }

  interface GhostwebDownload {
    id: string;
    filename: string;
    source: string;
    state: 'downloading' | 'quarantined' | 'interrupted';
    riskLevel: 'scanning' | 'no_known_threat' | 'suspicious' | 'malicious' | 'unable_to_scan' | 'blocked';
    receivedBytes: number;
    totalBytes: number;
    hash: string | null;
    message: string | null;
  }

  interface GhostwebAlias {
    id: string;
    address: string;
    forwardingTarget: string | null;
    createdAt: number;
  }

  interface GhostwebMailbox {
    id: string;
    address: string;
    createdAt: number;
    expiresAt: number;
    messageCount: number;
  }

  interface GhostwebNetworkStatus {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    message: string | null;
  }

  interface GhostwebRoute {
    entryNode: string | null;
    exitCountry: string | null;
    hopCount: number;
  }

  interface Window {
    ghostweb: {
      session: {
        getStatus: () => Promise<GhostwebSessionStatus>;
        end: () => Promise<GhostwebSessionStatus>;
      };
      downloads: {
        list: () => Promise<GhostwebDownload[]>;
        onUpdate: (listener: (downloads: GhostwebDownload[]) => void) => () => void;
      };
      privacy: {
        getLevel: () => Promise<'standard' | 'balanced' | 'strict'>;
        setLevel: (level: 'standard' | 'balanced' | 'strict') => Promise<'standard' | 'balanced' | 'strict'>;
      };
      mail: {
        list: () => Promise<{ aliases: GhostwebAlias[]; mailboxes: GhostwebMailbox[] }>;
        createAlias: () => Promise<GhostwebAlias>;
        createMailbox: (expiresInMinutes: number) => Promise<GhostwebMailbox>;
        deleteAlias: (aliasId: string) => Promise<void>;
        deleteMailbox: (mailboxId: string) => Promise<void>;
      };
      network: {
        status: () => Promise<GhostwebNetworkStatus>;
        route: () => Promise<GhostwebRoute>;
        connect: () => Promise<GhostwebNetworkStatus>;
        disconnect: () => Promise<GhostwebNetworkStatus>;
        test: () => Promise<{ connected: boolean; message: string }>;
      };
    };
  }
}

export {};
