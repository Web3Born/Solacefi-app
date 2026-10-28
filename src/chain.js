// DEMO CHAIN LAYER. Everything here is local and fake: no blockchain, no real money.
// To go live, replace the bodies of these functions with Aleo wallet / SDK calls
// (see README) and keep the same signatures so the screens do not change.
const K = 'solacefi.demo.v1'
const A = 'acdefghjklmnpqrstuvwxyz023456789'
const addr = () => 'aleo1' + Array.from({ length: 58 }, () => A[Math.floor(Math.random() * A.length)]).join('')
const seed = () => ({ adeola: { name: 'Adeola', addr: addr() }, ngozi: { name: 'Ngozi', addr: addr() }, jumia: { name: 'Jumia', addr: addr() } })
export const fresh = () => ({ user: null, balance: 0, txs: [], dir: seed(), settings: { frozen: false, hide: false, recv: true, sent: true, sec: true, news: false } })
export const load = () => { try { return JSON.parse(localStorage.getItem(K)) || fresh() } catch { return fresh() } }
export const save = s => { try { localStorage.setItem(K, JSON.stringify(s)) } catch {} }
export const available = (s, id) => !s.dir[id]
export const lookup = (s, id) => s.dir[id] || null
export const claim = (s, id) => { const a = addr(); return { ...s, user: { ...s.user, payId: id, address: a }, dir: { ...s.dir, [id]: { name: s.user.name, addr: a } } } }
const tx = (type, label, amount, to) => ({ id: Math.random().toString(36).slice(2, 10), ts: Date.now(), type, label, amount, to })
export const fund = (s, n) => ({ ...s, balance: +(s.balance + n).toFixed(2), txs: [tx('fund', 'Test funds added', n), ...s.txs] })
export const send = async (s, to, n) => {
  await new Promise(r => setTimeout(r, 900))
  if (!s.dir[to]) throw new Error('No account found with that Pay ID')
  if (n > s.balance) throw new Error('Not enough balance')
  return tx('out', 'To @' + to, n, to)
}
export const apply = (s, t) => ({ ...s, balance: +(s.balance - t.amount).toFixed(2), txs: [t, ...s.txs] })
