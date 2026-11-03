// DEMO CHAIN LAYER. Everything here is local and fake: no blockchain, no real money.
// To go live, replace the bodies of these functions with Aleo wallet / SDK calls
// (see README) and keep the same signatures so the screens do not change.
const K = 'solacefi.demo.v1'
const LIVE = !!import.meta.env.VITE_FIREBASE_PROJECT_ID
const A = 'acdefghjklmnpqrstuvwxyz023456789'
const addr = () => 'aleo1' + Array.from({ length: 58 }, () => A[Math.floor(Math.random() * A.length)]).join('')
const seed = () => ({ adeola: { name: 'Adeola', addr: addr() }, ngozi: { name: 'Ngozi', addr: addr() }, jumia: { name: 'Jumia', addr: addr() } })
export const RATE = 1500 // DEMO rate: naira per dollar. Not a real exchange rate.
export const fresh = () => ({ user: null, balance: 0, txs: [], goals: [], seen: 0, dir: LIVE ? {} : seed(), claimed: [], settings: { frozen: false, hide: false, recv: true, sent: true, sec: true, news: false } })
export const load = () => { try { const v = JSON.parse(localStorage.getItem(K)); return v ? { ...fresh(), ...v } : fresh() } catch { return fresh() } }
export const save = s => { try { localStorage.setItem(K, JSON.stringify(s)) } catch {} }
export const available = (s, id) => !s.dir[id]
export const lookup = (s, id) => s.dir[id] || null
export const claim = (s, id) => { const a = addr(); return { ...s, user: { ...s.user, payId: id, address: a }, dir: { ...s.dir, [id]: { name: s.user.name, addr: a } } } }
const tx = (type, label, amount, to, note = '') => ({ id: Math.random().toString(36).slice(2, 10), ts: Date.now(), type, label, amount, to, note })
export const fund = (s, n) => ({ ...s, balance: +(s.balance + n).toFixed(6), txs: [tx('fund', 'Test funds added', n), ...s.txs] })
export const send = async (s, to, n, note = '') => {
  await new Promise(r => setTimeout(r, 900))
  if (!s.dir[to]) throw new Error('No account found with that Pay ID')
  if (n > s.balance) throw new Error('Not enough balance')
  return tx('out', 'To @' + to, n, to, note)
}
export const apply = (s, t) => ({ ...s, balance: +(s.balance - t.amount).toFixed(6), txs: [t, ...s.txs] })
const rid = () => Math.random().toString(36).slice(2, 8)
const r2 = n => +n.toFixed(6)
export const bill = (s, label, n) => apply(s, tx('bill', label, n))
export const newGoal = (s, name, target) => ({ ...s, goals: [...s.goals, { id: rid(), name, target, saved: 0 }] })
export const toVault = (s, id, n) => { const g = s.goals.find(x => x.id === id); return g ? { ...s, balance: r2(s.balance - n), goals: s.goals.map(x => x.id === id ? { ...x, saved: r2(x.saved + n) } : x), txs: [tx('vault', 'To Vault: ' + g.name, n), ...s.txs] } : s }
export const fromVault = (s, id) => { const g = s.goals.find(x => x.id === id); return g ? { ...s, balance: r2(s.balance + g.saved), goals: s.goals.filter(x => x.id !== id), txs: g.saved > 0 ? [tx('unvault', 'From Vault: ' + g.name, g.saved), ...s.txs] : s.txs } : s }
export const markSeen = s => ({ ...s, seen: Date.now() })
export const onramp = (s, ngn, usd) => ({ ...s, balance: r2(s.balance + usd), txs: [tx('onramp', `Added ₦${ngn.toLocaleString()} (demo)`, usd), ...s.txs] })
export const offramp = (s, usd, bank) => apply(s, tx('offramp', 'Cash out to ' + bank, usd))
export const receive = (s, t) => ({ ...s, balance: r2(s.balance + t.amount), txs: [tx('in', 'From @' + t.from, t.amount, t.from, t.note || ''), ...s.txs], claimed: [...(s.claimed || []), t.id].slice(-200) })
