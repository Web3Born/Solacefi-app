// Pay ID directory + demo transfer inbox shared between phones (Firebase).
// If the VITE_FIREBASE_* settings are missing, live() is false and the app keeps using the local demo directory.
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}
const O = () => (typeof window !== 'undefined' ? window.__SOLACE_DIR__ : undefined) // test hook
export const live = () => !!O() || !!(cfg.apiKey && cfg.projectId && cfg.appId)
let ctx
const init = () => {
  if (!ctx) {
    ctx = (async () => {
      const [{ initializeApp }, { getAuth, signInAnonymously }, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
      const app = initializeApp(cfg)
      const cred = await signInAnonymously(getAuth(app)) // returns the same anonymous user on later launches
      return { fs, db: fs.getFirestore(app), uid: cred.user.uid }
    })()
    ctx.catch(() => { ctx = null })
  }
  return ctx
}
export const uid = async () => O() ? O().uid() : (await init()).uid
export const lookup = async id => {
  if (O()) return O().lookup(id)
  const { fs, db } = await init()
  const d = await fs.getDoc(fs.doc(db, 'payids', id))
  return d.exists() ? d.data() : null
}
export const available = async id => !(await lookup(id))
export const claim = async (id, name, addr) => {
  if (O()) return O().claim(id, name, addr)
  const { fs, db, uid } = await init()
  await fs.runTransaction(db, async t => {
    const ref = fs.doc(db, 'payids', id)
    if ((await t.get(ref)).exists()) throw new Error('taken')
    t.set(ref, { uid, name, addr, created: Date.now() })
  })
  return uid
}
export const sendTransfer = async t => {
  if (O()) return O().sendTransfer(t)
  const { fs, db } = await init()
  await fs.addDoc(fs.collection(db, 'transfers'), { ...t, ts: Date.now(), claimed: false })
}
export const listen = async cb => {
  if (O()) return O().listen(cb)
  const { fs, db, uid } = await init()
  return fs.onSnapshot(fs.query(fs.collection(db, 'transfers'), fs.where('toUid', '==', uid), fs.where('claimed', '==', false)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}
export const markClaimed = async id => {
  if (O()) return O().markClaimed(id)
  const { fs, db } = await init()
  await fs.updateDoc(fs.doc(db, 'transfers', id), { claimed: true })
}
