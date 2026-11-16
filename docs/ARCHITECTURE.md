# Architecture

SolaceFi is a React (Vite) app that runs in a browser and, wrapped with Capacitor, as an Android app.

```
Phone or browser
  src/App.jsx        screens and flows
  src/chain.js       DEMO money: local balances and transactions (replace with Aleo calls)
  src/lock.js        PIN lock: salted hash on the device
  src/biometric.js   fingerprint / face unlock (Android app only)
  src/directory.js   shared Pay ID directory (Firebase, optional)
  src/aleo.js        Aleo TESTNET wallet via a Dynamic embedded wallet (optional)
  src/banks.js       sample list of Nigerian banks for the cash-out demo
Services (all optional)
  Firebase Auth (anonymous) + Firestore    Pay ID directory and demo transfers (rules in firestore.rules)
  Dynamic                                  embedded wallet, email login
  Aleo testnet                             credits.aleo private transfers
Build and hosting
  Vercel                                   web app
  GitHub Actions                           Android debug APK, published on Releases
```

## Data flow today
- **Demo mode:** everything stays on the device in localStorage.
- **With Firebase:** a Pay ID maps to a user id, a demo address and optionally an Aleo address. Demo payments are written to a `transfers` collection and claimed by the recipient app.
- **With Dynamic:** the wallet screen asks the embedded wallet to move public credits to a private record and to send a private transfer. The build refuses to send if the network is not testnet.

## Planned
Pay to a Pay ID on the real network, USDCx and USAD, real accounts and recovery, licensed ramp partners. See the project guide.
