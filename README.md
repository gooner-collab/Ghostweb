# Ghostweb

Ghostweb is an Electron-based browser prototype for privacy-conscious browsing. It is designed around minimizing locally stored browsing data and being explicit about which protections are actually active.

## Current Build

This first shell includes:

- A temporary-session dashboard with honest status indicators
- Secure Electron defaults: context isolation, disabled Node integration, and sandboxed renderer content
- Browser chrome and navigation surfaces ready for the tab/session implementation
- Download quarantine with SHA-256 hashing, dangerous-extension blocking, archive caution, and explicit scan failure states
- Private mail surface that clearly identifies its delivery service as unimplemented

The following are **not implemented** yet: tracker blocking, antivirus scanning, real web navigation, and mail delivery. Tor/arti integration is wired but requires the `arti` executable to be installed and available on `PATH`; until then the dashboard reports an error. Fingerprint levels now apply WebRTC leak prevention, user-agent normalization, canvas noise/blocking, WebGL blocking in Strict, and audio noise/blocking; permission prompts are not implemented. Download checks are local heuristics, not a malware verdict. No security state is simulated. A file will never be opened automatically by Ghostweb.

## Privacy Model

Real tracking resistance comes from architectural separation of knowledge, not obfuscation:

- An entry relay knows the user's real IP, but not which website they are visiting.
- A middle relay knows neither the user nor the destination; it passes encrypted traffic.
- An exit relay knows the destination website, but not the user's real IP.
- No single relay can link who someone is to where they are browsing.

This can help against casual tracking by advertisers, data brokers, an ISP seeing which sites are visited, and websites logging a user's real IP. It does not prevent a logged-in site from knowing the user's identity, a global observer from attempting traffic correlation, malware on the device, or identification based on information given to a site.

See [docs/privacy-browser-spec.md](docs/privacy-browser-spec.md) for the implementation contract and [docs/limitations.md](docs/limitations.md) for the current capability boundary.

## Development

```bash
npm install
npm run dev
```

Build the renderer with `npm run build`. The desktop shell loads the Vite development server in development and the built renderer in production.

## Tests

Run the full Phase 9 suite with:

```bash
npm test
```

The suite covers alias and mailbox lifecycle, download hashing and classification, failed-scan honesty, fingerprint policy generation, network state accuracy, the preload boundary, and the renderer CSP contract.
