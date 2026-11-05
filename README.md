# SolaceFi app (demo v0.5)

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
No real sign-in verification, passkeys, recovery, face/fingerprint unlock, notifications or service worker yet.

## App lock (PIN)
Settings > Security > App lock sets a 6-digit PIN. Only a salted PBKDF2 hash is stored, on this device.
The app locks on launch and after you leave it (right away, 1 or 5 minutes). Five wrong tries trigger waiting periods.
This protects the screen from someone picking up your phone. It does not encrypt wallet keys, and in demo mode
"Forgot PIN" clears demo data because there is no account recovery yet.

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

## Updating the Android app
Debug APKs are now signed with a fixed key (`ci/debug.keystore`, a public debug key, never for store releases),
so a new APK installs over the old one. APKs built before v0.5.2 used a different random key each run:
uninstall the old SolaceFi app once, then install the new APK. Check Settings > About > Version to confirm the update.

## Getting the newest APK (easy way)
After each push, open the repo on GitHub > Releases > "SolaceFi latest build". Tap `SolaceFi-debug.apk` to download and install it.
The installed app is a frozen copy: it only changes when you install a newer APK. The lock screen shows the version at the bottom.

## v0.7.0 features
Home redesign (profile greeting, help and notification bell with badge, balance card with History and Add funds, privacy check-up strip,
recent activity, quick actions, services grid), Notifications, Airtime & Data top-up (demo rate), Vault savings goals, Privacy check-up.
All of it runs on local demo data: no real payments, no real telecom purchases, no real exchange rate.

## v0.8.0: bridge between naira and USDCx (demo)
Home > Add money / Cash out. Add money: naira, bank transfer, converted to USDC, moved to private USDCx. Cash out: USDCx leaves private mode
(a public step), converts to naira, goes to a bank account. Everything is simulated. Going live needs a licensed ramp partner and the issuer bridge;
SolaceFi should not hold customer funds or run the bridge itself.

## v0.8.1
Smaller Add money button, and a searchable cash-out bank picker with 35 Nigerian banks and fintechs (OPay, Moniepoint, PalmPay, Kuda and more). The list is a sample; the live list will come from the licensed partner.

## v0.9.0
Dollar / naira display (flip switch on the balance card and in Settings; amounts you type follow the chosen currency; demo rate).
Hold-to-reveal balance (hide the balance, then press and hold it to peek). Animated private-send sequence
(encrypt, prove, verify, settle) that explains what the live network will do. Glass and aurora look with a shield orb that turns gold when no PIN is set.

## v0.11.0: real Aleo testnet wallet (first version)
Settings > Aleo testnet wallet. Email login, embedded wallet, public and private balances, "Move to private", "Send privately" to an Aleo address
or a Pay ID linked to a wallet, explorer link. Testnet only: sending is switched off if the wallet reports mainnet.
Needs a Dynamic environment: see ALEO-WALLET-SETUP.md. Written from Dynamic's docs and tested here only against a stand-in; expect first-run fixes.
The Dynamic packages are set to "latest" so their versions match: after the first successful build, pin the installed versions in package.json.
The old .npmrc (legacy-peer-deps) was removed so npm installs the SDK's peer packages normally. If the install fails with ERESOLVE, tell me and I will adjust.
