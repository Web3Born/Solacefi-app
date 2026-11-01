import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import * as chain from './chain.js'
import { App as CapApp } from '@capacitor/app'
import { BANKS, POPULAR } from './banks.js'
import { loadLock, saveLock, makeLock, check, weak, failed, cleared, secure } from './lock.js'

const P = {
  up: 'M7 17L17 7M8 7h9v9', down: 'M17 7L7 17M16 17H7V8', plus: 'M12 5v14M5 12h14', back: 'M15 6l-6 6 6 6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6h-6',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2', check: 'M5 12l5 5L20 7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3', del: 'M21 5H9l-6 7 6 7h12zM15 9l-4 6M11 9l4 6', bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0', help: 'M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9a2.5 2.5 0 115 0c0 1.5-2.5 2-2.5 3.5M12 17h.01', phone: 'M7 2h10v20H7zM11 18h2', vault: 'M4 5h16v14H4zM12 9a3 3 0 100 6 3 3 0 000-6zM4 9h2M4 15h2', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', more: 'M6 12h.01M12 12h.01M18 12h.01', bank: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18', wifi: 'M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M9 17a4 4 0 016 0M12 20h.01', tv: 'M3 7h18v12H3zM8 3l4 4 4-4', card2: 'M3 6h18v12H3zM3 10h18', req: 'M3 6h18v12H3zM3 7l9 6 9-6', list: 'M4 6h16M4 12h16M4 18h10', alert: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v6M12 16.5h.01'
}
const I = ({ n, s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
let CUR = 'USD'
const FX = chain.RATE
const money = n => CUR === 'NGN' ? '₦' + Math.round(n * FX).toLocaleString('en-NG') : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const alt = n => CUR === 'NGN' ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '₦' + Math.round(n * FX).toLocaleString('en-NG')
const sym = () => CUR === 'NGN' ? '₦' : '$'
const toUSD = a => +(CUR === 'NGN' ? a / FX : a).toFixed(6)
const fromUSD = u => CUR === 'NGN' ? Math.round(u * FX) : u
const short = a => a.slice(0, 8) + '…' + a.slice(-4)
const when = t => { const d = Math.floor((Date.now() - t) / 864e5); return d < 1 ? 'Today' : d < 2 ? 'Yesterday' : new Date(t).toLocaleDateString() }
const nm = c => c.includes('@') ? c.split('@')[0].replace(/^./, x => x.toUpperCase()) : 'Friend'
const clean = v => v.toLowerCase().replace(/^@/, '').trim()
const VERSION = '0.9.0'
const press = (a, k) => k === '←' ? a.slice(0, -1) : k === '.' ? (a.includes('.') ? a : (a || '0') + '.') : /\.\d{2}$/.test(a) ? a : a === '0' ? k : a + k
const Keys = ({ on }) => <div className="keys">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'].map(k => <button key={k} aria-label={k === '←' ? 'Delete' : k} onClick={() => on(k)}>{k}</button>)}</div>
const Logo = () => <span className="logo"><img src="/logo-mark.png" alt="" /><span>Solace<b>Fi</b></span></span>
const Back = ({ go, to = 'home' }) => <button className="back" aria-label="Back" onClick={() => go(to)}><I n="back" s={20} /></button>
const vibe = () => { try { navigator.vibrate?.(15) } catch {} }
const hue = x => [...x].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360
const Av = ({ name, size = 40 }) => <span className="av" style={{ width: size, height: size, background: `hsl(${hue(name)} 70% 62%)`, fontSize: size * .42 }}>{name[0].toUpperCase()}</span>
const NEG = ['out', 'vault', 'bill', 'offramp']
const neg = t => NEG.includes(t.type)
const ICON = { out: 'up', in: 'down', fund: 'plus', bill: 'phone', vault: 'vault', unvault: 'vault', onramp: 'bank', offramp: 'bank' }
const kind = t => ({ out: 'Sent', in: 'Received', fund: 'Test funds', bill: 'Top-up', vault: 'Saved to Vault', unvault: 'From Vault', onramp: 'Added from naira', offramp: 'Cashed out to bank' }[t.type])
function useCount(v) {
  const [x, setX] = useState(v)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setX(v); return }
    let raf; const t0 = performance.now(), f = x
    const step = t => { const q = Math.min((t - t0) / 700, 1); setX(f + (v - f) * (1 - Math.pow(1 - q, 3))); if (q < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }, [v])
  return x
}
const Nav = ({ on, go }) => {
  const b = ([k, l, i]) => <button key={k} className={on === k ? 'on' : ''} aria-current={on === k ? 'page' : undefined} onClick={() => go(k)}><I n={i} />{l}</button>
  return (
    <nav className="nav" aria-label="Main">
      {[['home', 'Home', 'home'], ['activity', 'Activity', 'list']].map(b)}
      <button className="fab" aria-label="Send money" onClick={() => go('send')}><I n="up" s={26} /></button>
      {[['vault', 'Vault', 'vault'], ['settings', 'Me', 'gear']].map(b)}
    </nav>
  )
}
function TxRow({ t, onClick }) {
  return (
    <button className="row tx" onClick={onClick}>
      <span className="ic"><I n={ICON[t.type] || 'plus'} s={18} /></span>
      <div style={{ flex: 1, textAlign: 'left' }}><div>{t.label}</div><div className="muted small">{when(t.ts)}{t.note ? ' · ' + t.note : ''}</div></div>
      <b className={'num amt ' + (neg(t) ? '' : 'pos')}>{neg(t) ? '-' : '+'}{money(t.amount)}</b>
    </button>
  )
}
function Sheet({ t, close }) {
  useEffect(() => { const k = e => e.key === 'Escape' && close(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  return (
    <div className="scrim" onClick={close}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Payment details" onClick={e => e.stopPropagation()}>
        <span className="grab" />
        <div className="center" style={{ gap: 4 }}><span className="num" style={{ fontSize: 40 }}>{neg(t) ? '-' : '+'}{money(t.amount)}</span><span className="muted">{t.label}</span></div>
        <div><R k="Type" v={kind(t)} /><R k="Status" v="Completed (demo)" />{t.note && <R k="Note" v={t.note} />}<R k="Time" v={new Date(t.ts).toLocaleString()} /><R k="Receipt" v={t.id} mono /></div>
        <button className="btn sec" onClick={close}>Close</button>
      </div>
    </div>
  )
}
function Week({ txs }) {
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 6 + i); return { t: d.getTime(), l: d.toLocaleDateString('en', { weekday: 'narrow' }), i: 0, o: 0 } })
  txs.forEach(x => { const d = days.find(d => x.ts >= d.t && x.ts < d.t + 864e5); if (d) d[neg(x) ? 'o' : 'i'] += x.amount })
  const max = Math.max(1, ...days.flatMap(d => [d.i, d.o])), tin = days.reduce((a, d) => a + d.i, 0), tout = days.reduce((a, d) => a + d.o, 0)
  return (
    <section className="wid"><div className="between"><h2>This week</h2><span className="muted small">Last 7 days</span></div>
      <div className="between small" style={{ margin: '8px 0 4px' }}><span><i className="dot g" />In {money(tin)}</span><span><i className="dot o" />Out {money(tout)}</span></div>
      <svg viewBox="0 0 280 96" className="bars" role="img" aria-label={`In ${money(tin)}, out ${money(tout)} over the last 7 days`}>
        {days.map((d, k) => { const x = k * 40 + 4, h1 = d.i / max * 64, h2 = d.o / max * 64; return (
          <g key={k}><rect x={x} y={72 - Math.max(h1, 3)} width="14" height={Math.max(h1, 3)} rx="4" fill="#2BE59A" opacity={d.i ? 1 : .25} />
            <rect x={x + 17} y={72 - Math.max(h2, 3)} width="14" height={Math.max(h2, 3)} rx="4" fill="#D6B56D" opacity={d.o ? 1 : .25} />
            <text x={x + 15} y="90" textAnchor="middle" fontSize="11" fill="#9DB4B0">{d.l}</text></g>) })}
      </svg></section>
  )
}
function Start({ st, go, set, say }) {
  const t = st.txs
  const items = [['Add test funds', t.some(x => x.type === 'fund'), () => { set(x => chain.fund(x, 100)); say(`Added ${money(100)} test funds`) }], ['Send your first payment', t.some(x => x.type === 'out'), () => go('send')], ['Share your Pay ID', !!st.settings.shared, () => go('receive')]]
  const n = items.filter(i => i[1]).length
  if (n === 3) return null
  return (
    <section className="wid"><div className="between"><h2>Get started</h2><span className="muted small">{n} of 3 done</span></div>
      <div className="prog" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow={n}><span style={{ width: n / 3 * 100 + '%' }} /></div>
      {items.map(([l, d, f]) => <button key={l} className={'chk ' + (d ? 'done' : '')} onClick={f} disabled={d}><span className="box2">{d && <I n="check" s={14} />}</span>{l}</button>)}</section>
  )
}
function Quick({ st, setTo, go }) {
  const recent = [...new Set(st.txs.filter(t => t.type === 'out').map(t => t.to))]
  const ids = [...recent, ...Object.keys(st.dir).filter(k => !recent.includes(k))].filter(k => k !== st.user.payId && st.dir[k]).slice(0, 6)
  return (
    <section><div className="between"><h2>Quick send</h2><span className="muted small">Tap to pay</span></div>
      <div className="quick">{ids.map(k => <button key={k} onClick={() => { setTo('@' + k); go('send') }}><Av name={st.dir[k].name} size={52} /><span>{st.dir[k].name}</span></button>)}</div></section>
  )
}
const R = ({ k, v, mono }) => <div className="row between"><span className="muted">{k}</span><span className={mono ? 'mono' : ''}>{v}</span></div>

export default function App() {
  const [st, setSt] = useState(chain.load)
  CUR = st.settings.cur || 'USD'
  const [scr, setScr] = useState(() => chain.load().user?.payId ? 'home' : 'welcome')
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [last, setLast] = useState(null)
  const [note, setNote] = useState('')
  const [svc, setSvc] = useState('airtime')
  const [cv, setCv] = useState('add')
  const [toast, setToast] = useState('')
  const [lock, setLockS] = useState(loadLock)
  const [locked, setLocked] = useState(() => !!loadLock() && !!chain.load().user)
  const [pinMode, setPinMode] = useState('set')
  const setLock = l => { saveLock(l); setLockS(l) }
  const say = m => { setToast(m); vibe(); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(''), 2200) }
  const set = fn => setSt(s => { const n = fn(s); chain.save(n); return n })
  const reset = () => { set(() => chain.fresh()); setLock(null); setLocked(false); setScr('welcome') }
  useEffect(() => {
    let t = 0
    const f = () => { if (document.hidden) t = Date.now(); else if (lock && t && (Date.now() - t) / 1000 >= lock.after) setLocked(true) }
    document.addEventListener('visibilitychange', f)
    let hd
    try { CapApp.addListener('appStateChange', ({ isActive }) => { if (!isActive) t = Date.now(); else if (lock && t && (Date.now() - t) / 1000 >= lock.after) setLocked(true) }).then(x => { hd = x }).catch(() => {}) } catch {}
    return () => { document.removeEventListener('visibilitychange', f); hd && hd.remove() }
  }, [lock])
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('pay') && st.user?.payId) {
      setTo('@' + clean(q.get('pay'))); const a = q.get('amt'); if (a && /^\d+(\.\d{1,2})?$/.test(a)) setAmt(String(fromUSD(+a)))
      setNote((q.get('note') || '').slice(0, 60)); setScr('send')
    }
  }, [])
  const p = { st, set, go: setScr, to, setTo, amt, setAmt, last, setLast, say, note, setNote, lock, setLock, pinMode, setPinMode, reset, svc, setSvc, cv, setCv }
  const S = { welcome: Welcome, payid: PayId, ready: Ready, home: Home, send: Send, review: Review, done: Done, receive: Receive, request: Request, pin: Pin, notifs: Notifs, topup: TopUp, convert: Convert, sending: Sending, vault: Vault, privacy: Privacy, activity: Activity, settings: Settings, blocked: Blocked }[scr]
  if (locked && lock) return <main className="app"><div className="scr"><LockScreen lock={lock} setLock={setLock} open={() => setLocked(false)} reset={reset} user={st.user} /></div></main>
  return <main className="app"><div className="scr" key={scr}><S {...p} /></div><div className={'toast' + (toast ? ' show' : '')} role="status" aria-live="polite">{toast}</div></main>
}

function Welcome({ set, go }) {
  const [v, setV] = useState('')
  const c = v.trim()
  const ok = /^\S+@\S+\.\S+$/.test(c) || /^\+?[0-9 ()-]{7,}$/.test(c)
  const next = e => { e.preventDefault(); set(s => ({ ...s, user: { contact: c, name: nm(c) } })); go('payid') }
  return (
    <form onSubmit={next} style={{ display: 'contents' }}>
      <Logo />
      <div><h1>Create your account</h1><p className="muted" style={{ marginTop: 10 }}>No wallet setup. No long addresses. We take care of it.</p></div>
      <div className="field"><label htmlFor="c" className="muted small">Email or phone number</label>
        <input id="c" className="in" value={v} onChange={e => setV(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
      <button className="btn" disabled={!ok}>Continue</button>
      <button type="button" className="btn sec" disabled>Passkey (coming soon)</button>
      <p className="muted small center" style={{ marginTop: 'auto' }}>Demo mode. Test funds only. No blockchain is connected yet.</p>
    </form>
  )
}

function PayId({ st, set, go }) {
  const [v, setV] = useState('')
  const id = clean(v)
  const valid = /^[a-z0-9_.]{3,20}$/.test(id)
  const free = valid && chain.available(st, id)
  const claim = e => { e.preventDefault(); set(s => chain.claim(s, id)); go('ready') }
  return (
    <form onSubmit={claim} style={{ display: 'contents' }}>
      <h1>Choose your Pay ID</h1>
      <p className="muted">Friends type this to pay you. Your wallet address stays behind the scenes.</p>
      <div className="field"><label htmlFor="p" className="muted small">Pay ID</label>
        <div className="in pid"><span>@</span><input id="p" value={v.replace(/^@/, '')} onChange={e => setV(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck="false" /></div>
        <div role="status">{id && (!valid ? <p className="err">Use 3 to 20 letters, numbers, _ or .</p> : free ? <p className="ok">@{id} is available</p> : <p className="err">@{id} is taken</p>)}</div>
      </div>
      <button className="btn" disabled={!free} style={{ marginTop: 'auto' }}>Claim @{id || '…'}</button>
    </form>
  )
}

function PayCard({ u, set, say, amt = 0, note = '' }) {
  const [qr, setQr] = useState('')
  const mark = () => set && set(s => ({ ...s, settings: { ...s.settings, shared: true } }))
  const link = `${import.meta.env.VITE_PUBLIC_URL || location.origin}/?pay=${u.payId}${amt ? '&amt=' + amt : ''}${note ? '&note=' + encodeURIComponent(note) : ''}`
  useEffect(() => { QRCode.toDataURL(link, { margin: 1, width: 360 }).then(setQr).catch(() => {}) }, [link])
  const copy = async () => { try { await navigator.clipboard.writeText('@' + u.payId); say('Pay ID copied'); mark() } catch { say('Copy is not available here') } }
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: 'Pay me on SolaceFi', text: amt ? `Please pay me ${money(amt)} on SolaceFi` : 'Pay me on SolaceFi', url: link }); else { await navigator.clipboard.writeText(link); say('Link copied') } mark() } catch {}
  }
  return (
    <div className="card center">
      <div className="num" style={{ fontSize: 36 }}>@{u.payId}</div>
      {amt > 0 && <div className="center" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24, color: 'var(--g)' }}>Requesting {money(amt)}</b>{note && <span className="muted small">{note}</span>}</div>}
      {qr && <img className="qr" src={qr} alt={`QR code for @${u.payId}`} />}
      <div className="two"><button className="btn sec" onClick={copy}>Copy Pay ID</button><button className="btn sec" onClick={share}>Share link</button></div>
    </div>
  )
}

function Ready({ st, go, set, say }) {
  const u = st.user
  return (<>
    <div className="center"><span className="okc"><I n="check" s={28} /></span><h1>You are all set</h1><p className="muted">Share your Pay ID to get paid.</p></div>
    <PayCard u={u} set={set} say={say} />
    <R k="Wallet address (demo)" v={short(u.address)} mono />
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => go('home')}>Go to home</button>
  </>)
}

const notifList = (st, lock) => {
  const l = st.txs.slice(0, 15).map(t => ({ id: t.id, ts: t.ts, title: kind(t), text: `${neg(t) ? '-' : '+'}${money(t.amount)} · ${t.label}` }))
  if (!lock) l.push({ id: 'tip-pin', ts: 2, title: 'Secure your app', text: 'Turn on the PIN lock in Settings.' })
  l.push({ id: 'welcome', ts: 1, title: 'Welcome to SolaceFi', text: 'This is a demo. No real money and no blockchain yet.' })
  return l
}
const checkup = (st, lock) => [
  { k: 'App lock (PIN) is on', ok: !!lock, fix: 'pin' },
  { k: 'Balance is hidden on Home', ok: st.settings.hide, fix: 'hide' },
  { k: 'Security alerts are on', ok: st.settings.sec, fix: 'sec' },
  { k: 'Auto-lock is 1 minute or less', ok: !!lock && lock.after <= 60, fix: 'pin2' }
]
function Home({ st, set, go, setTo, say, lock, setPinMode, setSvc, setCv }) {
  const h = st.settings.hide, bal = useCount(st.balance)
  const [sel, setSel] = useState(null), [peek, setPeek] = useState(false)
  const veiled = h && !peek
  const shown = veiled ? sym() + '8,888.88' : money(bal)
  const unread = notifList(st, lock).filter(n => n.ts > st.seen).length
  const ck = checkup(st, lock), done = ck.filter(c => c.ok).length
  const fund = () => { set(s => chain.fund(s, 100)); say(`Added ${money(100)} test funds`) }
  const prompt = !lock ? ['Secure your app with a PIN', 'Takes about 20 seconds', 'Set up', () => { setPinMode('set'); go('pin') }]
    : st.txs.length === 0 ? ['Add money to try a payment', 'Naira to USDCx, demo only', 'Add', () => { setCv('add'); go('convert') }] : null
  const svcs = [['Airtime', 'phone', () => { setSvc('airtime'); go('topup') }], ['Data', 'wifi', () => { setSvc('data'); go('topup') }], ['Vault', 'vault', () => go('vault')], ['Privacy', 'shield', () => go('privacy')],
    ['Request', 'req', () => go('request')], ['Receive', 'down', () => go('receive')], ['Cards', 'card2', () => say('Cards are coming soon')], ['More', 'more', () => say('More services are on the way')]]
  const goal = st.goals[0]
  return (<>
    <div className="between">
      <button className="who" onClick={() => go('settings')} aria-label="Open profile"><Av name={st.user.name} size={44} /><span>Hi, {st.user.name}</span></button>
      <div className="hdr">
        <a className="ib" href="mailto:Solacefipay@gmail.com" aria-label="Help"><I n="help" /></a>
        <button className="ib" aria-label={'Notifications' + (unread ? `, ${unread} new` : '')} onClick={() => go('notifs')}><I n="bell" />{unread > 0 && <b className="badge">{unread}</b>}</button>
      </div>
    </div>
    <div className={'card bal' + (lock ? '' : ' nolock')}>
      <svg className="orb" viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="og"><stop offset="0" stopColor="#d7fff0" /><stop offset="1" stopColor="#2BE59A" stopOpacity="0" /></radialGradient></defs>
        <circle cx="60" cy="60" r="24" fill="url(#og)" /><circle className="r1" cx="60" cy="60" r="38" /><circle className="r2" cx="60" cy="60" r="52" /></svg>
      <div className="between"><span className="small hl"><I n="shield" s={16} /> Available balance
        <button className="eye" aria-label={h ? 'Always show balance' : 'Hide balance'} onClick={() => set(s => ({ ...s, settings: { ...s.settings, hide: !h } }))}><I n="eye" s={18} /></button></span>
        <button className="link light" onClick={() => go('activity')}>History ›</button></div>
      <div className="between" style={{ marginTop: 6 }}>
        <div className="balbox" onPointerDown={() => h && setPeek(true)} onPointerUp={() => setPeek(false)} onPointerLeave={() => setPeek(false)} onPointerCancel={() => setPeek(false)} onContextMenu={e => e.preventDefault()}>
          <div key={CUR + veiled} className={'num flip' + (veiled ? ' veil' : '')} style={{ fontSize: shown.length > 12 ? 24 : shown.length > 10 ? 30 : shown.length > 8 ? 36 : undefined }} role="text" aria-label={veiled ? 'Balance hidden. Press and hold to reveal.' : money(bal)}>{shown}</div>
          <span className="small alt">{veiled ? 'Hold to reveal' : '≈ ' + alt(st.balance)}</span></div>
        <button className="pill" onClick={() => { setCv('add'); go('convert') }}>+ Add money</button></div>
      <div className="between" style={{ marginTop: 10 }}><span className="chip" style={{ margin: 0 }}><I n="alert" /> Demo: test funds</span>
        <div className="cur" role="group" aria-label="Show amounts in">{[['USD', '$'], ['NGN', '₦']].map(([k, l]) => <button key={k} className={CUR === k ? 'on' : ''} aria-pressed={CUR === k} onClick={() => set(s => ({ ...s, settings: { ...s.settings, cur: k } }))}>{l}</button>)}</div></div>
    </div>
    <button className="strip" onClick={() => go('privacy')}><I n="shield" s={20} /><span>Privacy check-up</span><b>{done} of {ck.length}</b><span aria-hidden="true">›</span></button>
    {st.txs.length > 0 && <section className="wid slim">{st.txs.slice(0, 3).map(t => <TxRow key={t.id} t={t} onClick={() => setSel(t)} />)}</section>}
    <section className="tiles">
      {[['To Pay ID', 'up', () => go('send')], ['Add money', 'plus', () => { setCv('add'); go('convert') }], ['Cash out', 'bank', () => { setCv('out'); go('convert') }]].map(([l, i, f]) => <button key={l} onClick={f}><span><I n={i} s={24} /></span>{l}</button>)}
    </section>
    {prompt && <section className="prompt"><div><b>{prompt[0]}</b><p className="muted small">{prompt[1]}</p></div><button className="pill dark" onClick={prompt[3]}>{prompt[2]}</button></section>}
    <section className="wid"><h2 style={{ marginBottom: 12 }}>Services</h2><div className="grid4">{svcs.map(([l, i, f]) => <button key={l} onClick={f}><span><I n={i} s={24} /></span>{l}</button>)}</div></section>
    <button className="promo" onClick={() => go('vault')}>
      <div><b>{goal ? goal.name : 'Start a savings goal'}</b><p className="muted small">{goal ? `${money(goal.saved)} of ${money(goal.target)} saved` : 'Small savings today, big plans tomorrow.'}</p>
        <div className="prog"><span style={{ width: goal ? Math.min(100, goal.saved / goal.target * 100) + '%' : '0%' }} /></div></div><span className="pill dark">{goal ? 'Open' : 'Start'}</span>
    </button>
    <Quick st={st} setTo={setTo} go={go} />
    <Week txs={st.txs} />
    {sel && <Sheet t={sel} close={() => setSel(null)} />}
    <Nav on="home" go={go} />
  </>)
}

function BankSheet({ bank, choose, close }) {
  const [q, setQ] = useState('')
  useEffect(() => { const k = e => e.key === 'Escape' && close(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  const f = q.trim().toLowerCase()
  const list = f ? BANKS.filter(b => b.toLowerCase().includes(f)) : BANKS
  const item = b => <button key={b} className={'bk' + (b === bank ? ' on' : '')} onClick={() => choose(b)}><Av name={b} size={34} /><span>{b}</span>{b === bank && <I n="check" s={18} />}</button>
  return (
    <div className="scrim" onClick={close}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose a bank" onClick={e => e.stopPropagation()}>
        <span className="grab" /><h2>Choose a bank</h2>
        <input className="in slim" autoFocus aria-label="Search banks" placeholder="Search banks" value={q} onChange={e => setQ(e.target.value)} />
        <div className="banklist">
          {!f && <><p className="muted small">Popular</p>{POPULAR.map(item)}<p className="muted small" style={{ marginTop: 14 }}>All banks</p></>}
          {list.map(item)}
          {list.length === 0 && <p className="muted center">No bank matches “{q}”.</p>}
        </div>
      </div>
    </div>
  )
}

function Convert({ st, set, go, say, cv, setCv }) {
  const [amt, setAmt] = useState(''), [bank, setBank] = useState(''), [pick, setPick] = useState(false), [acct, setAcct] = useState(''), [phase, setPhase] = useState('form'), [step, setStep] = useState(0)
  const add = cv === 'add', n = parseFloat(amt) || 0
  const usd = add ? +(n / chain.RATE).toFixed(6) : toUSD(n), ngn = add ? n : Math.round(usd * chain.RATE)
  const ok = add ? n >= 1000 : usd > 0 && usd <= st.balance && !!bank && /^\d{10}$/.test(acct)
  const stages = add ? ['Bank transfer received', 'Converted to USDC', 'Moved to private USDCx'] : ['Moved out of private mode (public step)', 'Converted to naira', 'Sent to your bank']
  useEffect(() => {
    if (phase !== 'run') return
    let i = 0
    const t = setInterval(() => { i++; setStep(i); if (i === 3) { clearInterval(t); set(s => add ? chain.onramp(s, ngn, usd) : chain.offramp(s, usd, `${bank} ••${acct.slice(-4)}`)); setPhase('done') } }, 1100)
    return () => clearInterval(t)
  }, [phase])
  if (phase === 'done') return (<>
    <div className="center" style={{ marginTop: 40 }}><span className="okc pop"><I n="check" s={28} /></span><h1>{add ? 'Money added' : 'Cash out on its way'}</h1>
      <p className="muted">{add ? `${money(usd)} USDCx added to your balance` : `₦${ngn.toLocaleString()} to ${bank} ••${acct.slice(-4)}`}</p><p className="muted small">Demo only. No real money moved.</p></div>
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => go('home')}>Done</button>
  </>)
  if (phase === 'run') return (<>
    <h1>{add ? 'Adding money' : 'Cashing out'}</h1><p className="muted">{add ? `₦${ngn.toLocaleString()} to about ${money(usd)} USDCx` : `${money(usd)} USDCx to about ₦${ngn.toLocaleString()}`}</p>
    <section>{stages.map((l, i) => <div key={l} className={'stage ' + (step > i ? 'done' : step === i ? 'now' : '')}><span className="dotc">{step > i && <I n="check" s={14} />}</span>{l}</div>)}</section>
  </>)
  if (phase === 'pay') return (<>
    <div className="top"><Back go={() => setPhase('form')} /><h1>Pay by bank transfer</h1></div>
    <div className="card"><p className="muted small">Send exactly</p><div className="num" style={{ fontSize: 40 }}>₦{n.toLocaleString()}</div>
      <R k="Bank" v="Demo Bank (partner)" /><R k="Account" v="0123456789" mono /><R k="Reference" v="SOLACE-DEMO" mono /></div>
    <p className="muted small">In the live app, a licensed partner gives you real account details here. These are placeholders.</p>
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => { setStep(0); setPhase('run') }}>I have sent the money</button>
  </>)
  return (<>
    <div className="top"><Back go={go} /><h1>Naira ⇄ USDCx</h1></div>
    <div className="seg" role="tablist">{[['add', 'Add money'], ['out', 'Cash out']].map(([k, l]) => <button key={k} role="tab" aria-selected={cv === k} className={cv === k ? 'on' : ''} onClick={() => { setCv(k); setAmt('') }}>{l}</button>)}</div>
    <div className="field"><label htmlFor="ca" className="muted small">{add ? 'Amount in naira (₦)' : `Amount to cash out (${sym()})`}</label>
      <input id="ca" className="in" inputMode="decimal" value={amt} onChange={e => setAmt(e.target.value.replace(/[^\d.]/g, ''))} placeholder={add ? '5000' : CUR === 'NGN' ? '25000' : '25'} /></div>
    <div className="seg small-seg">{(add ? [5000, 10000, 50000] : CUR === 'NGN' ? [10000, 25000, 50000] : [10, 25, 50]).map(v => <button key={v} onClick={() => setAmt(String(v))}>{(add ? '₦' : sym()) + v.toLocaleString()}</button>)}{!add && <button onClick={() => setAmt(String(fromUSD(st.balance)))}>Max</button>}</div>
    {!add && <><div className="field"><span className="muted small">Bank</span>
        <button className="in picker" onClick={() => setPick(true)} aria-haspopup="dialog"><span className={bank ? '' : 'muted'}>{bank || 'Select bank'}</span><span aria-hidden="true">▾</span></button></div>
      <div className="field"><label htmlFor="ac" className="muted small">Account number</label><input id="ac" className="in" inputMode="numeric" maxLength={10} value={acct} onChange={e => setAcct(e.target.value.replace(/\D/g, ''))} placeholder="0123456789" /></div></>}
    <p className="muted small">{n > 0 ? (add ? `You get about ${money(usd)} USDCx.` : `You receive about ₦${ngn.toLocaleString()}.`) : 'Enter an amount.'} Demo rate: ₦{chain.RATE.toLocaleString()} = $1. Fees and the real rate come from the partner.</p>
    {add && n > 0 && n < 1000 && <p className="err">Minimum is ₦1,000 in this demo</p>}
    {!add && usd > st.balance && <p className="err">Amount is more than your balance</p>}
    <div className="notice">{add ? 'A licensed partner handles the bank transfer and conversion, and will ask you to verify your ID before your first deposit. Skipped in this demo.' : 'Cashing out is a public step on the network, so this amount is not private. Your partner will also check your ID before the first cash-out. Skipped in this demo.'}</div>
    {pick && <BankSheet bank={bank} choose={b => { setBank(b); setPick(false) }} close={() => setPick(false)} />}
    <button className="btn" disabled={!ok} style={{ marginTop: 'auto' }} onClick={() => add ? setPhase('pay') : (setStep(0), setPhase('run'))}>{add ? 'Continue' : 'Cash out'}</button>
    {add && <button className="link" onClick={() => { set(s => chain.fund(s, 100)); say(`Added ${money(100)} test funds`) }}>Just want quick demo money? Get {money(100)} test funds</button>}
  </>)
}

function Notifs({ st, set, go, lock }) {
  useEffect(() => { set(chain.markSeen) }, [])
  const list = notifList(st, lock)
  return (<>
    <div className="top"><Back go={go} /><h1>Notifications</h1></div>
    <section>{list.map(n => <div className="row" key={n.id}><span className="ic"><I n="bell" s={18} /></span><div style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{n.title}</b><div className="muted small">{n.text}</div></div></div>)}</section>
  </>)
}

function TopUp({ st, set, go, say, svc, setSvc }) {
  const [net, setNet] = useState('MTN'), [num, setNum] = useState(''), [amt, setAmt] = useState(0), [plan, setPlan] = useState('')
  const plans = [['500 MB', 300], ['1 GB', 500], ['2 GB', 900], ['5 GB', 1800]]
  const usd = +(amt / chain.RATE).toFixed(6)
  const err = amt > 0 && usd > st.balance ? 'Not enough balance' : ''
  const ok = /^0[789]\d{9}$/.test(num) && amt > 0 && !err
  const buy = () => { set(s => chain.bill(s, `${svc === 'airtime' ? 'Airtime' : 'Data ' + plan} · ${net} ${num.slice(-4)}`, usd)); say('Top-up successful (demo)'); go('home') }
  return (<>
    <div className="top"><Back go={go} /><h1>Airtime & Data</h1></div>
    <div className="seg" role="tablist">{[['airtime', 'Airtime'], ['data', 'Data']].map(([k, l]) => <button key={k} role="tab" aria-selected={svc === k} className={svc === k ? 'on' : ''} onClick={() => { setSvc(k); setAmt(0); setPlan('') }}>{l}</button>)}</div>
    <div className="seg small-seg" aria-label="Network">{['MTN', 'Airtel', 'Glo', '9mobile'].map(n => <button key={n} className={net === n ? 'on' : ''} onClick={() => setNet(n)}>{n}</button>)}</div>
    <div className="field"><label htmlFor="ph" className="muted small">Phone number</label><input id="ph" className="in" inputMode="numeric" maxLength={11} value={num} onChange={e => setNum(e.target.value.replace(/\D/g, ''))} placeholder="08012345678" /></div>
    <div className="opts">{(svc === 'airtime' ? [100, 200, 500, 1000].map(v => [`₦${v}`, v]) : plans.map(p => [`${p[0]} · ₦${p[1]}`, p[1], p[0]])).map(([l, v, pl]) => <button key={l} className={amt === v && (svc === 'airtime' || plan === pl) ? 'on' : ''} onClick={() => { setAmt(v); setPlan(pl || '') }}>{l}</button>)}</div>
    <p className="muted small">{amt > 0 ? `You pay about ${money(usd)} (₦${amt.toLocaleString()})` : 'Choose an amount'}. Demo rate: ₦{chain.RATE.toLocaleString()} = $1. Nothing is really sent.</p>
    {err && <p className="err">{err}</p>}
    <button className="btn" disabled={!ok} onClick={buy} style={{ marginTop: 'auto' }}>Pay {amt > 0 ? money(usd) : ''}</button>
  </>)
}

function Vault({ st, set, go, say }) {
  const [name, setName] = useState(''), [target, setTarget] = useState('')
  const t = toUSD(parseFloat(target) || 0)
  const add = (g, n) => { if (n > st.balance) return say('Not enough balance'); set(s => chain.toVault(s, g.id, n)); say(`Saved ${money(n)} to ${g.name}`) }
  return (<>
    <h1>Vault</h1><p className="muted">Set money aside for something you want. Test funds only.</p>
    {st.goals.length === 0 && <div className="empty center"><span className="ic big"><I n="vault" /></span><p className="muted small">No goals yet. Create your first one below.</p></div>}
    {st.goals.map(g => (
      <section className="wid" key={g.id}><div className="between"><h2>{g.name}</h2><b className="num amt">{money(g.saved)} <span className="muted small">/ {money(g.target)}</span></b></div>
        <div className="prog" role="progressbar" aria-valuemin="0" aria-valuemax={g.target} aria-valuenow={g.saved}><span style={{ width: Math.min(100, g.saved / g.target * 100) + '%' }} /></div>
        <div className="two" style={{ marginTop: 12, gridTemplateColumns: '1fr 1fr 1fr' }}><button className="btn sec" onClick={() => add(g, 10)}>+ {money(10)}</button><button className="btn sec" onClick={() => add(g, 25)}>+ {money(25)}</button>
          <button className="btn sec" onClick={() => { set(s => chain.fromVault(s, g.id)); say('Moved back to your balance') }}>Withdraw</button></div></section>))}
    <section className="wid"><h2 style={{ marginBottom: 10 }}>New goal</h2>
      <div className="field"><label htmlFor="gn" className="muted small">What are you saving for?</label><input id="gn" className="in" value={name} maxLength={24} onChange={e => setName(e.target.value)} placeholder="Laptop" /></div>
      <div className="field" style={{ marginTop: 10 }}><label htmlFor="gt" className="muted small">{`Target amount (${sym()})`}</label><input id="gt" className="in" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value.replace(/[^\d.]/g, ''))} placeholder={CUR === 'NGN' ? '500000' : '500'} /></div>
      <button className="btn" style={{ marginTop: 14 }} disabled={!name.trim() || !(t > 0)} onClick={() => { set(s => chain.newGoal(s, name.trim(), t)); setName(''); setTarget(''); say('Goal created') }}>Create goal</button></section>
    <Nav on="vault" go={go} />
  </>)
}

function Privacy({ st, set, go, lock, setPinMode }) {
  const ck = checkup(st, lock), done = ck.filter(c => c.ok).length
  const fix = f => f === 'pin' ? (setPinMode('set'), go('pin')) : f === 'pin2' ? go('settings') : set(s => ({ ...s, settings: { ...s.settings, [f]: true } }))
  return (<>
    <div className="top"><Back go={go} /><h1>Privacy check-up</h1></div>
    <div className="card center"><span className="num" style={{ fontSize: 48 }}>{done} of {ck.length}</span><p className="muted small">protections on for this device</p>
      <div className="prog" style={{ width: '100%' }}><span style={{ width: done / ck.length * 100 + '%' }} /></div></div>
    <section>{ck.map(c => <div className="row" key={c.k}><span className={'ic ' + (c.ok ? '' : 'off')}><I n={c.ok ? 'check' : 'alert'} s={18} /></span><div style={{ flex: 1 }}>{c.k}</div>{!c.ok && <button className="pill dark" onClick={() => fix(c.fix)}>Fix</button>}</div>)}</section>
    <p className="muted small">This check-up covers settings on this phone. It does not make payments private by itself. When the real network is connected, we will explain exactly what stays private.</p>
  </>)
}

function Activity({ st, go }) {
  const [f, setF] = useState('all'), [sel, setSel] = useState(null)
  const list = st.txs.filter(t => f === 'all' || (f === 'out') === neg(t))
  const groups = list.reduce((m, t) => { const k = when(t.ts); (m[k] = m[k] || []).push(t); return m }, {})
  return (<>
    <h1>Activity</h1>
    <div className="seg" role="tablist" aria-label="Filter activity">{[['all', 'All'], ['out', 'Sent'], ['in', 'Received']].map(([k, l]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{l}</button>)}</div>
    {list.length === 0 && <div className="empty center"><span className="ic big"><I n="list" /></span><p className="muted">Nothing here yet.</p></div>}
    {Object.entries(groups).map(([k, ts]) => <section key={k}><h2 className="muted small" style={{ fontWeight: 500 }}>{k}</h2>{ts.map(t => <TxRow key={t.id} t={t} onClick={() => setSel(t)} />)}</section>)}
    {sel && <Sheet t={sel} close={() => setSel(null)} />}
    <Nav on="activity" go={go} />
  </>)
}

function Send({ st, go, to, setTo, amt, setAmt, note, setNote }) {
  const id = clean(to)
  const rec = id ? chain.lookup(st, id) : null
  const me = id && id === st.user.payId
  const n = toUSD(parseFloat(amt) || 0)
  const err = !id ? '' : me ? 'You cannot send to yourself' : !rec ? 'No account found with that Pay ID' : n > st.balance ? 'Amount is more than your balance' : ''
  const ok = rec && !me && n > 0 && n <= st.balance
  return (<>
    <div className="top"><Back go={go} /><h1>Send</h1></div>
    <div className="field"><label htmlFor="t" className="muted small">To</label>
      <input id="t" className="in" value={to} onChange={e => setTo(e.target.value)} placeholder="@adeola" autoComplete="off" autoCapitalize="none" spellCheck="false" />
      <div role="status" style={{ minHeight: 32 }}>
        {rec && !me && <div className="top" style={{ gap: 10 }}><Av name={rec.name} size={32} /><b style={{ fontWeight: 500 }}>{rec.name}</b><span className="mono muted">{short(rec.addr)}</span></div>}
        {err && <p className="err">{err}</p>}</div></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 52 }}>{sym()}{amt || '0'}</div><p className="muted small">Available {money(st.balance)}</p></div>
    <input className="in slim" aria-label="Note (optional)" value={note} maxLength={60} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
    <div className="seg small-seg">{(CUR === 'NGN' ? [5000, 10000, 25000, 50000] : [5, 10, 25, 50]).map(v => <button key={v} onClick={() => setAmt(String(v))}>{sym() + v.toLocaleString()}</button>)}<button onClick={() => setAmt(String(fromUSD(st.balance)))}>Max</button></div>
    <Keys on={k => setAmt(a => press(a, k))} />
    <button className="btn" disabled={!ok} onClick={() => go('review')}>Review</button>
  </>)
}

function Review({ st, set, go, to, amt, setLast, note }) {
  const id = clean(to), rec = chain.lookup(st, id), n = toUSD(parseFloat(amt))
  const [busy, setBusy] = useState(false)
  const [e, setE] = useState('')
  if (!rec || !(n > 0)) return <><p>Nothing to review.</p><button className="btn" onClick={() => go('send')}>Back to send</button></>
  const send = () => { if (st.settings.frozen) return go('blocked'); go('sending') }
  return (<>
    <div className="top"><Back go={go} to="send" /><h1>Review payment</h1></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 48 }}>{money(n)}</div><p className="muted">to @{id} · about {alt(n)}</p></div>
    <div><R k="Name" v={rec.name} /><R k="Address" v={short(rec.addr)} mono /><R k="Network fee" v="None in demo mode" />{note && <R k="Note" v={note} />}</div>
    <div className="box"><b>Who can see this (when live)</b>
      <span><b>The public:</b> nothing</span><span><b>You and {rec.name}:</b> amount and names</span><span><b>Compliance partner:</b> details, for safety checks</span></div>
    {e && <p className="err" role="alert">{e}</p>}
    <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
      <button className="btn" disabled={busy} onClick={send}>{busy ? 'Sending…' : `Send ${money(n)}`}</button>
      <button className="btn sec" disabled={busy} onClick={() => go('send')}>Cancel</button></div>
  </>)
}

function useScramble(text, on) {
  const [v, setV] = useState(text)
  useEffect(() => {
    if (!on) { setV(text); return }
    const g = '█▓▒░#@%&0123456789'
    const t = setInterval(() => setV([...text].map(c => /[\d]/.test(c) ? g[Math.floor(Math.random() * g.length)] : c).join('')), 70)
    return () => clearInterval(t)
  }, [text, on])
  return v
}
function Sending({ st, set, go, to, amt, note, setLast }) {
  const id = clean(to), rec = chain.lookup(st, id), n = toUSD(parseFloat(amt))
  const [step, setStep] = useState(0), [err, setErr] = useState('')
  const stages = ['Encrypting the details', 'Generating the proof', 'Verifying on the network', 'Settled privately']
  const shown = useScramble(money(n), step < 3 && !err)
  useEffect(() => {
    let i = 0, dead = false
    const t = setInterval(async () => {
      if (dead) return
      i++; setStep(i)
      if (i === 3) {
        clearInterval(t)
        try { const tx = await chain.send(st, id, n, note); if (dead) return; set(s => chain.apply(s, tx)); setLast(tx); setStep(4); setTimeout(() => { if (!dead) go('done') }, 1300) }
        catch (x) { setErr(x.message || 'Payment failed') }
      }
    }, 1100)
    return () => { dead = true; clearInterval(t) }
  }, [])
  if (!rec) return <button className="btn" onClick={() => go('send')}>Back</button>
  return (<>
    <div className="center" style={{ marginTop: 24, gap: 14 }}>
      <div className="orbwrap" aria-hidden="true"><Av name={st.user.name} size={52} /><span className="beam"><i /><i /><i /></span><span className="core" /><span className="beam"><i /><i /><i /></span><Av name={rec.name} size={52} /></div>
      <div className="num" style={{ fontSize: 44 }} aria-label={step >= 3 ? money(n) : 'Amount hidden while sending'}>{shown}</div>
      <p className="muted">to @{id}</p>
    </div>
    <section>{stages.map((l, i) => <div key={l} className={'stage ' + (step > i ? 'done' : step === i ? 'now' : '')}><span className="dotc">{step > i && <I n="check" s={14} />}</span>{l}</div>)}</section>
    {err ? <><p className="err" role="alert">{err}</p><button className="btn" onClick={() => go('send')}>Back</button></> : <p className="muted small center" role="status">Demo: this shows what will happen on the real network.</p>}
  </>)
}

function Done({ go, last, setAmt, setTo, setNote }) {
  useEffect(() => { vibe() }, [])
  if (!last) return <button className="btn" onClick={() => go('home')}>Home</button>
  return (<>
    <div className="center" style={{ marginTop: 40 }}><span className="okc pop"><I n="check" s={28} /></span><h1>Payment sent</h1>
      <p className="muted">{money(last.amount)} to @{last.to}</p></div>
    <div><R k="Receipt" v={last.id} mono />{last.note && <R k="Note" v={last.note} />}<R k="Time" v={new Date(last.ts).toLocaleString()} /><R k="Mode" v="Demo, no blockchain" /></div>
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => { setAmt(''); setTo(''); setNote(''); go('home') }}>Done</button>
  </>)
}

function Receive({ st, go, set, say }) {
  return (<>
    <div className="top"><Back go={go} /><h1>Receive</h1></div>
    <PayCard u={st.user} set={set} say={say} />
    <button className="btn sec" onClick={() => go('request')}>Request a specific amount</button>
    <p className="muted small center">Anyone with your Pay ID can send you money.</p>
    <Nav on="receive" go={go} />
  </>)
}

function Request({ st, go, set, say }) {
  const [amt, setA] = useState(''), [note, setN] = useState(''), [made, setMade] = useState(false)
  const n = toUSD(parseFloat(amt) || 0)
  if (made) return (<>
    <div className="top"><Back go={() => setMade(false)} /><h1>Your request</h1></div>
    <PayCard u={st.user} set={set} say={say} amt={n} note={note} />
    <p className="muted small center">Whoever opens this link or scans the code gets a payment screen with the amount filled in.</p>
    <button className="btn sec" onClick={() => go('home')} style={{ marginTop: 'auto' }}>Done</button>
  </>)
  return (<>
    <div className="top"><Back go={go} /><h1>Request money</h1></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 52 }}>{sym()}{amt || '0'}</div><p className="muted small">How much do you want to receive?</p></div>
    <input className="in slim" aria-label="Note (optional)" value={note} maxLength={60} onChange={e => setN(e.target.value)} placeholder="What is it for? (optional)" />
    <Keys on={k => setA(a => press(a, k))} />
    <button className="btn" disabled={!(n > 0)} onClick={() => setMade(true)}>Create request</button>
  </>)
}

function PinPad({ value, onKey, error, disabled }) {
  const press = k => { try { navigator.vibrate?.(8) } catch {} onKey(k) }
  return (<>
    <div className={'dots big' + (error ? ' shake bad' : '')} role="img" aria-label={`${value.length} of 6 digits entered`}>{[...Array(6)].map((_, i) => <span key={i} className={i < value.length ? 'on' : ''} />)}</div>
    <p className="err center" role="alert" style={{ minHeight: 24 }}>{error}</p>
    <div className="pkeys">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map(k => k === '' ? <span key="gap" /> : <button key={k} className={k === '←' ? 'del' : ''} disabled={disabled} aria-label={k === '←' ? 'Delete' : k} onClick={() => press(k)}>{k === '←' ? <I n="del" s={30} /> : k}</button>)}</div>
  </>)
}
const mask = c => !c ? '' : c.includes('@') ? c.replace(/^(.{2}).*(@.*)$/, '$1•••$2') : '•••' + c.slice(-4)
function LockScreen({ lock, setLock, open, reset, user }) {
  const [pin, setPin] = useState(''), [err, setErr] = useState(''), [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t) }, [])
  const wait = Math.max(0, Math.ceil((lock.until - now) / 1000))
  const done = async p => {
    try {
      if (await check(lock, p)) { setLock(cleared(lock)); open(); return }
      const l = failed(lock); setLock(l); setPin('')
      setErr(l.until ? 'Too many tries. Please wait.' : `Wrong PIN. ${5 - l.fails} tries left.`)
    } catch (e) { setPin(''); setErr(e.message || 'Could not check the PIN') }
  }
  const key = k => { if (wait) return; if (k === '←') return setPin(p => p.slice(0, -1)); if (pin.length >= 6) return; const n = pin + k; setPin(n); if (n.length === 6) done(n) }
  return (<>
    <div className="center lockhead"><Av name={user?.name || 'S'} size={72} /><h1>Welcome back{user?.name ? ', ' + user.name : ''}</h1><p className="muted small">{user?.contact ? mask(user.contact) : 'SolaceFi is locked'}</p>
      <p className="muted">{wait ? `Try again in ${wait}s` : 'Enter your 6-digit PIN'}</p></div>
    <PinPad value={pin} onKey={key} error={err} disabled={!!wait} />
    <button className="link" style={{ marginTop: 'auto' }} onClick={() => confirm('In demo mode there is no recovery. This clears all demo data on this device. Continue?') && reset()}>Forgot PIN?</button>
    <p className="muted small center">SolaceFi v{VERSION}</p>
  </>)
}
function Pin({ go, lock, setLock, say, pinMode }) {
  const [stage, setStage] = useState(pinMode === 'set' ? 'new' : 'verify'), [pin, setPin] = useState(''), [first, setFirst] = useState(''), [err, setErr] = useState('')
  const title = { verify: 'Enter your current PIN', new: 'Choose a 6-digit PIN', confirm: 'Confirm your PIN' }[stage]
  const done = async p => {
    setErr(''); setPin('')
    try {
    if (stage === 'verify') {
      if (!(await check(lock, p))) return setErr('Wrong PIN')
      if (pinMode === 'off') { setLock(null); say('App lock is off'); return go('settings') }
      setStage('new')
    } else if (stage === 'new') {
      if (weak(p)) return setErr('Choose a less obvious PIN')
      setFirst(p); setStage('confirm')
    } else if (p === first) { setLock(await makeLock(p, lock?.after ?? 60)); say('App lock is on'); go('settings') }
    else { setErr('PINs did not match. Try again.'); setStage('new') }
    } catch (e) { setErr('Could not save the PIN: ' + (e.message || e)) }
  }
  const key = k => { if (k === '←') return setPin(p => p.slice(0, -1)); if (pin.length >= 6) return; const n = pin + k; setPin(n); if (n.length === 6) done(n) }
  return (<>
    <div className="top"><Back go={go} to="settings" /><h1 style={{ fontSize: 26 }}>{title}</h1></div>
    <p className="muted small center">The PIN stays on this device. It locks the app when you leave it.</p>
    <PinPad value={pin} onKey={key} error={err} />
  </>)
}

function Settings({ st, set, go, lock, setLock, setPinMode, reset: doReset }) {
  const s = st.settings
  const [name, setName] = useState(st.user.name)
  const tog = (k, l) => <label className="tog"><span>{l}</span><input type="checkbox" role="switch" checked={!!s[k]} onChange={e => set(x => ({ ...x, settings: { ...x.settings, [k]: e.target.checked } }))} /></label>
  const reset = msg => { if (confirm(msg)) doReset() }
  const pin = m => { setPinMode(m); go('pin') }
  const after = v => setLock({ ...lock, after: v })
  return (<>
    <h1>Settings</h1>
    <section className="grp"><h2>Profile</h2>
      <div className="field"><label htmlFor="n" className="muted small">Display name</label>
        <input id="n" className="in" value={name} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && set(x => ({ ...x, user: { ...x.user, name: name.trim() } }))} /></div>
      <R k="Pay ID" v={'@' + st.user.payId} /></section>
    <section className="grp"><h2>Display</h2><div className="rowbtn" style={{ display: 'grid', gap: 8 }}><span>Show amounts in</span><div className="seg small-seg">{[['USD', 'Dollars ($)'], ['NGN', 'Naira (₦)']].map(([k, l]) => <button key={k} className={CUR === k ? 'on' : ''} onClick={() => set(x => ({ ...x, settings: { ...x.settings, cur: k } }))}>{l}</button>)}</div><span className="muted small">Demo rate: ₦{FX.toLocaleString()} = $1</span></div></section>
    <section className="grp"><h2>Privacy</h2>{tog('hide', 'Hide balance')}
      <details><summary>What is private?</summary><p>When live, private transfers are designed to be hidden from the public, while you, the recipient and a compliance partner can see details. Deposits and cash-outs are public steps. This demo does not use a blockchain.</p></details></section>
    <section className="grp"><h2>Notifications</h2>{tog('recv', 'Payments received')}{tog('sent', 'Payments sent')}{tog('sec', 'Security alerts')}{tog('news', 'Product news')}
      <p className="muted small">Preferences are saved. Alerts start when the real app launches.</p></section>
    <section className="grp"><h2>Security</h2>
      <button className="rowbtn" onClick={() => pin(lock ? 'off' : 'set')}><span>App lock (PIN)</span><span className={lock ? 'ok' : 'muted'}>{lock ? 'On' : 'Off'}</span></button>
      {lock && <button className="rowbtn" onClick={() => pin('change')}><span>Change PIN</span><span className="muted">›</span></button>}
      {lock && <div className="rowbtn" style={{ display: 'grid', gap: 8 }}><span>Lock after leaving the app</span><div className="seg small-seg">{[[0, 'Right away'], [60, '1 min'], [300, '5 min']].map(([v, l]) => <button key={v} className={lock.after === v ? 'on' : ''} onClick={() => after(v)}>{l}</button>)}</div></div>}
      <div className="off"><R k="Passkey" v="Coming soon" /><R k="Recovery method" v="Coming soon" /><R k="Face or fingerprint unlock" v="Coming soon" /></div></section>
    <section className="grp"><h2>Demo tools</h2>{tog('frozen', 'Simulate a paused account')}</section>
    <section className="grp"><h2>About</h2><R k="Version" v={VERSION + ' (demo)'} /><R k="Network" v="None. Demo mode." /><R k="Secure storage" v={secure() ? 'Yes' : 'Basic mode'} />
      <R k="Support" v={<a href="mailto:Solacefipay@gmail.com" style={{ color: 'var(--g)' }}>Email us</a>} /></section>
    <button className="btn sec" onClick={() => reset('Log out? In demo mode this clears the demo data on this device.')}>Log out</button>
    <button className="btn sec danger" onClick={() => reset('Delete your demo account and all demo data on this device?')}>Delete account</button>
    <Nav on="settings" go={go} />
  </>)
}

function Blocked({ go }) {
  return (<>
    <div className="top"><Back go={go} /><h1>Send</h1></div>
    <div className="center" style={{ margin: 'auto 0' }}><span className="warn"><I n="alert" s={34} /></span>
      <h2 style={{ fontSize: 28 }}>This account cannot send right now</h2>
      <p className="muted">Our compliance partner has paused sending for this account. You can still view your balance and activity.</p></div>
    <div style={{ display: 'grid', gap: 10 }}>
      <a className="btn" href="mailto:Solacefipay@gmail.com" style={{ display: 'grid', placeItems: 'center' }}>Contact support</a>
      <button className="btn sec" onClick={() => go('home')}>View balance</button></div>
  </>)
}
