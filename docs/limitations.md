# Current Limitations

Ghostweb 0.1.0 is a development prototype. Its dashboard is a truthful status surface, not evidence that every planned privacy service is active.

- Tor multi-hop routing through arti is integrated as a sidecar and requires the `arti` executable on the host. Ghostweb starts it with `arti proxy -p 9150`. Without it, the network state is `error` and no proxy is applied.
- Tracker blocking is not implemented. Fingerprint levels apply the documented WebRTC, user-agent, canvas, WebGL, and audio policies; permission prompts are not implemented.
- Web navigation and tabs are currently UI surfaces only.
- Antivirus scanning is not implemented. Downloads are quarantined, hashed with SHA-256, checked against dangerous extensions, and assigned local heuristic risk states. No downloaded file is opened automatically.
- Private mail delivery is not implemented and must remain labeled `DEV_MOCK` until a provider is connected.
- Temporary session teardown and complete non-persistence tests are not implemented.

The automated suite validates the implemented contracts and boundaries. It does not claim that the missing arti executable, antivirus engine, provider-backed mail delivery, or OS-level forensic behavior has been tested.

The product does not promise anonymity or untraceability. A site can identify a person who logs in or supplies identifying information. A global adversary may correlate traffic, and compromise of the user's device remains outside the browser's control.
