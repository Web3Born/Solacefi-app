# SolaceFi app (demo v0.3)

A working React app (Vite) with every prototype screen: sign-up, Pay ID, receive with QR code,
send with review, activity, settings, and the paused-account state.

**It is a DEMO. There is no blockchain, no real money and no account verification.**
Data lives only in the browser (localStorage). Addresses are fake placeholders.

## Run / deploy (no local build needed)
1. On GitHub create a new empty private repo, e.g. `Solacefi-app`.
2. In Termux:
   ```
   unzip -o ~/storage/downloads/solacefi-app-v0.1.zip -d ~/
   cd ~/solacefi-app
   git init -b main && git add . && git commit -m "SolaceFi app v0.1"
   git remote add origin https://github.com/Web3Born/Solacefi-app.git
   git push -u origin main
   ```
3. On vercel.com: Add New > Project > import `Solacefi-app`. Framework preset: Vite. Deploy.

Optional local run (needs a computer or a working npm): `npm install && npm run dev`.

## Going live on Aleo
All chain logic is in `src/chain.js`. Replace these functions, keeping the same shape:
- `available`, `lookup`, `claim`: Pay ID directory (a small API + database, or Aleo Name Service)
- `fund`: test-funds faucet (testnet)
- `send` / `apply`: private transfer of the test stablecoin via an Aleo wallet
Wallet connection guide: https://developer.aleo.org/guides/wallets/universal_wallet_adapter
Do not move real funds before security review and legal advice.

## Known gaps
No real sign-in verification, passkeys, app lock, recovery, notifications or service worker yet.

## Android app (APK)
Capacitor wraps this web app as a real Android app. The GitHub Action `.github/workflows/android.yml`
builds an installable debug APK on every push to `main` (or run it by hand: Actions > Build Android APK > Run workflow).
1. Open the finished run on GitHub, scroll to Artifacts, download `SolaceFi-debug-apk` (a zip).
2. Unzip it, open `app-debug.apk` on your Android phone and allow "install unknown apps" when asked.
3. Optional: in the repo, Settings > Secrets and variables > Actions > Variables, add `PUBLIC_URL` with your Vercel
   address so shared Pay ID links point to the website instead of the app.
Pushing a workflow file needs a GitHub token with the `workflow` scope.
The app ID `com.solacefi.app` cannot change after a Play Store release. Debug APKs are for testing only;
a store release needs a signed build, a Play developer account and the checks listed above.
iOS needs a Mac or a cloud Mac service (not set up yet).
