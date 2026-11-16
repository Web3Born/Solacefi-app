# Threat model (prototype)

This is an early, honest list. It will grow. Report new findings through SECURITY.md.

| Risk | Today | Mitigation or plan |
| --- | --- | --- |
| Someone picks up an unlocked phone | PIN lock and optional fingerprint, auto-lock when the app is left | Keep; add device-bound key storage later |
| Brute-forcing the PIN on the device | Salted hash, waiting periods after 5 wrong tries | A 6-digit PIN can be attacked offline if the device storage is copied; wallet keys must not rely on it |
| Fake or stolen Pay IDs | Rules: create once, no edits to the name or owner, no listing | Real accounts and recovery |
| Directory abuse or spam | Rules limit fields and sizes | Firebase App Check and billing alerts; rate limits |
| Fake demo payments | Demo money only; a modified app can write transfers | Demo only. Real payments move on-chain |
| Wallet provider outage or compromise | Wallet code isolated in src/aleo.js, testnet only | Add the Shield wallet; custody and legal review before mainnet |
| Mainnet by mistake | Send buttons switch off if the wallet reports mainnet | Keep the guard until an audit is done |
| Privacy limits | Timing, metadata and cash-in/cash-out points can reveal information | Say so in the app; explain public steps; selective disclosure |
| Supply chain | Dependabot and CodeQL | Pin versions after first stable build; review new dependencies |
| Secrets in the repo | None found in a scan; config values live in Vercel and GitHub variables | Secret scanning and push protection; keep real signing keys private |

Out of scope today: real funds, KYC data, partner integrations (these will be private and reviewed separately).
