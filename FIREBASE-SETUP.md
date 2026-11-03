# Turn on the shared Pay ID directory (10 minutes)

Without this, Pay IDs only exist on one phone (local demo). With it, any phone running SolaceFi can find any Pay ID and receive demo payments.

1. Go to console.firebase.google.com, Add project (any name, Analytics off is fine).
2. Build > Authentication > Get started > Sign-in method > Anonymous > Enable > Save.
3. Build > Firestore Database > Create database (production mode, pick a region near you).
4. In Firestore open the Rules tab, paste everything from `firestore.rules` in this project, tap Publish.
5. Project settings (gear) > Your apps > Web (`</>`) > register the app > copy `apiKey`, `authDomain`, `projectId`, `appId`.
6. Vercel: your project > Settings > Environment Variables. Add, for All Environments:
   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID. Then Deployments > Redeploy.
7. GitHub: your repo > Settings > Secrets and variables > Actions > Variables tab. Add the same four names, then push (or re-run the Android workflow).
8. If sign-in fails inside the Android app, add `localhost` in Firebase > Authentication > Settings > Authorized domains.

These four values are public identifiers, not passwords. The rules are what protect the data.
Each install signs in anonymously, so clearing app data or reinstalling means a new identity and you must pick a new Pay ID.
