# Turn on the real Aleo TESTNET wallet (about 15 minutes)

The app uses an embedded wallet from Dynamic: the user logs in with email, and a wallet is created for them (MPC based, no seed phrase to learn).
Test credits have no value. This build refuses to send on mainnet.

1. Go to console.dynamic.xyz and create a project. Use the SANDBOX environment. Copy the Environment ID (Developers > SDK & API Keys).
2. Chains & Networks: enable Aleo. Wallets: enable Embedded wallets (and automatic wallet creation if offered).
3. Sign-in methods: enable Email. In Sandbox you can also turn on Test accounts to log in without real email.
4. Security > Allowed Origins: add your Vercel address, plus `https://localhost` and `capacitor://localhost` (needed inside the Android app).
5. Developers > SDK & API Keys: if it offers the 2026_04_01 API version, stay on the older one for now. The new one needs step-up and device-registration screens this app does not have yet.
6. Add `VITE_DYNAMIC_ENV_ID` in Vercel (Environment Variables) and as a GitHub Actions variable. Redeploy / rebuild.
7. In the app: Settings > Aleo testnet wallet > log in with your email > copy your wallet address.
8. Get test credits for that address from the Aleo faucet (docs.aleo.org > Participate > Getting Tokens). Refresh the wallet screen: the Public balance should rise.
9. Tap "Move to private" to turn public credits into a private record, then try "Send privately" to another testnet address. Check the result on the explorer link.

Known limits (from Dynamic's docs): one transfer spends one record, so a payment can be at most the size of your largest private record.
First run may need small fixes: this code was written from the docs and has not run against the live service yet.
