# Ghostweb Privacy Browser Specification

## Non-negotiable honesty rules

Ghostweb must never claim that a user is untraceable, anonymous, or impossible to track. It must never pretend that an unwired feature is active. Unimplemented features are labeled `NOT_IMPLEMENTED` or `DEV_MOCK` in code and UI. OS security is never bypassed, downloaded files are never auto-executed, and spoofed network identities are never used.

A failed file scan returns `unable_to_scan` and the UI says **Unable to fully scan this file**. Dashboard counts are derived from real state; otherwise they say **Not implemented**.

## Architecture

- `src/browser`: Electron main process, window and tab management
- `src/ui`: React browser chrome and dashboard
- `src/privacy`: fingerprint resistance, tracker blocking, HTTPS enforcement
- `src/network`: `PrivacyNetwork` and real Tor/arti integration
- `src/mail`: alias and temporary mailbox lifecycle
- `src/downloads`: download and quarantine pipeline
- `src/security`: hashing, scanning, and risk classification
- `src/session`: temporary profile lifecycle
- `src/settings`: user privacy levels

Every Electron window uses context isolation, disabled Node integration, a sandboxed renderer, strict CSP, schema-validated IPC, and a vetted preload bridge. TLS validation remains enabled and web content cannot trigger arbitrary native commands.

## Required interfaces

### PrivacyNetwork

`connect`, `disconnect`, `getStatus`, `getCurrentRoute`, `selectExitCountry`, and `testConnection`. The status can only become `connected` when real arti/Tor routing is wired and verified. The supported arti 2.5.x sidecar command is `arti proxy -p 9150`. Otherwise it is an error with `Privacy network not implemented`.

### PrivateMailService

Supports alias creation/deletion, forwarding configuration, mailbox creation/expiration, inbox access, message access, and mailbox deletion. Delivery may be `DEV_MOCK` during Phase 1, but alias and mailbox lifecycle state must remain real.

### DownloadSecurity

Supports SHA-256 hashing, quarantine, local heuristic risk classification, and status lookup. Antivirus scanning is not implemented, so the local result is not a malware verdict. Dangerous executable types and macro-enabled documents are blocked. Archives are marked suspicious without extraction; contents are never auto-extracted or executed. Any file read or scan failure returns `unable_to_scan` and **Unable to fully scan this file**.

## Session lifecycle

Each session uses a fresh isolated temporary Electron partition. Termination closes tabs, destroys the partition, removes app-created temporary files, and clears app-created logs. OS forensic records, antivirus logs, filesystem recovery, and disk firmware are explicitly out of scope.

## Build order

1. Electron shell and secure IPC bridge
2. Temporary session/profile teardown
3. Download manager surface
4. Download security pipeline
5. Privacy dashboard wired to real state
6. Fingerprint resistance levels
7. Private mail lifecycle
8. Real arti/Tor integration
9. Full automated test suite
