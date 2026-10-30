import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import * as chain from './chain.js'

const P = {
  up: 'M7 17L17 7M8 7h9v9', down: 'M17 7L7 17M16 17H7V8', plus: 'M12 5v14M5 12h14', back: 'M15 6l-6 6 6 6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6h-6',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2', check: 'M5 12l5 5L20 7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3', req: 'M3 6h18v12H3zM3 7l9 6 9-6', list: 'M4 6h16M4 12h16M4 18h10', alert: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v6M12 16.5h.01'
}
const I = ({ n, s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const short = a => a.slice(0, 8) + '…' + a.slice(-4)
const when = t => { const d = Math.floor((Date.now() - t) / 864e5); return d < 1 ? 'Today' : d < 2 ? 'Yesterday' : new Date(t).toLocaleDateString() }
const nm = c => c.includes('@') ? c.split('@')[0].replace(/^./, x => x.toUpperCase()) : 'Friend'
const clean = v => v.toLowerCase().replace(/^@/, '').trim()
const press = (a, k) => k === '←' ? a.slice(0, -1) : k === '.' ? (a.includes('.') ? a : (a || '0') + '.') : /\.\d{2}$/.test(a) ? a : a === '0' ? k : a + k
const Keys = ({ on }) => <div className="keys">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'].map(k => <button key={k} aria-label={k === '←' ? 'Delete' : k} onClick={() => on(k)}>{k}</button>)}</div>
const Logo = () => <span className="logo"><img src="/logo-mark.png" alt="" /><span>Solace<b>Fi</b></span></span>
const Back = ({ go, to = 'home' }) => <button className="back" aria-label="Back" onClick={() => go(to)}><I n="back" s={20} /></button>
const vibe = () => { try { navigator.vibrate?.(15) } catch {} }
const hue = x => [...x].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360
const Av = ({ name, size = 40 }) => <span className="av" style={{ width: size, height: size, background: `hsl(${hue(name)} 70% 62%)`, fontSize: size * .42 }}>{name[0].toUpperCase()}</span>
const kind = t => t.type === 'out' ? 'Sent' : t.type === 'in' ? 'Received' : 'Test funds'
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
      {[['receive', 'Receive', 'qr'], ['settings', 'Settings', 'gear']].map(b)}
    </nav>
  )
}
function TxRow({ t, onClick }) {
  return (
    <button className="row tx" onClick={onClick}>
      <span className="ic"><I n={t.type === 'out' ? 'up' : t.type === 'in' ? 'down' : 'plus'} s={18} /></span>
      <div style={{ flex: 1, textAlign: 'left' }}><div>{t.label}</div><div className="muted small">{when(t.ts)}{t.note ? ' · ' + t.note : ''}</div></div>
      <b className={'num amt ' + (t.type === 'out' ? '' : 'pos')}>{t.type === 'out' ? '-' : '+'}{money(t.amount)}</b>
    </button>
  )
}
function Sheet({ t, close }) {
  useEffect(() => { const k = e => e.key === 'Escape' && close(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  return (
    <div className="scrim" onClick={close}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Payment details" onClick={e => e.stopPropagation()}>
        <span className="grab" />
        <div className="center" style={{ gap: 4 }}><span className="num" style={{ fontSize: 40 }}>{t.type === 'out' ? '-' : '+'}{money(t.amount)}</span><span className="muted">{t.label}</span></div>
        <div><R k="Type" v={kind(t)} /><R k="Status" v="Completed (demo)" />{t.note && <R k="Note" v={t.note} />}<R k="Time" v={new Date(t.ts).toLocaleString()} /><R k="Receipt" v={t.id} mono /></div>
        <button className="btn sec" onClick={close}>Close</button>
      </div>
    </div>
  )
}
function Week({ txs }) {
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 6 + i); return { t: d.getTime(), l: d.toLocaleDateString('en', { weekday: 'narrow' }), i: 0, o: 0 } })
  txs.forEach(x => { const d = days.find(d => x.ts >= d.t && x.ts < d.t + 864e5); if (d) d[x.type === 'out' ? 'o' : 'i'] += x.amount })
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
  const items = [['Add test funds', t.some(x => x.type === 'fund'), () => { set(x => chain.fund(x, 100)); say('Added $100.00 test funds') }], ['Send your first payment', t.some(x => x.type === 'out'), () => go('send')], ['Share your Pay ID', !!st.settings.shared, () => go('receive')]]
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
  const [scr, setScr] = useState(() => chain.load().user?.payId ? 'home' : 'welcome')
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [last, setLast] = useState(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const say = m => { setToast(m); vibe(); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(''), 2200) }
  const set = fn => setSt(s => { const n = fn(s); chain.save(n); return n })
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    if (q.get('pay') && st.user?.payId) {
      setTo('@' + clean(q.get('pay'))); const a = q.get('amt'); if (a && /^\d+(\.\d{1,2})?$/.test(a)) setAmt(a)
      setNote((q.get('note') || '').slice(0, 60)); setScr('send')
    }
  }, [])
  const p = { st, set, go: setScr, to, setTo, amt, setAmt, last, setLast, say, note, setNote }
  const S = { welcome: Welcome, payid: PayId, ready: Ready, home: Home, send: Send, review: Review, done: Done, receive: Receive, request: Request, activity: Activity, settings: Settings, blocked: Blocked }[scr]
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

function Home({ st, set, go, setTo, say }) {
  const h = st.settings.hide, bal = useCount(st.balance)
  const [sel, setSel] = useState(null)
  return (<>
    <div className="between"><div><p className="muted small">Hello</p><h2 style={{ fontSize: 24 }}>{st.user.name}</h2></div><span className="tag">Demo mode</span></div>
    <div className="card bal">
      <div className="between"><span className="small" style={{ color: '#a9c9c1' }}>Balance</span>
        <button className="eye" aria-label={h ? 'Show balance' : 'Hide balance'} onClick={() => set(s => ({ ...s, settings: { ...s.settings, hide: !h } }))}><I n="eye" /></button></div>
      <div className="num">{h ? '$••••' : money(bal)}</div>
      <p className="small" style={{ color: '#a9c9c1' }}>Test funds, not real money</p>
      <span className="chip"><I n="alert" /> Demo: no blockchain connected yet</span>
    </div>
    <div className="acts">
      <button className="act p" onClick={() => go('send')}><span><I n="up" s={24} /></span>Send</button>
      <button className="act" onClick={() => go('receive')}><span><I n="down" s={24} /></span>Receive</button>
      <button className="act" onClick={() => go('request')}><span><I n="req" s={24} /></span>Request</button>
      <button className="act" onClick={() => { set(s => chain.fund(s, 100)); say('Added $100.00 test funds') }}><span><I n="plus" s={24} /></span>Add funds</button>
    </div>
    <Start st={st} go={go} set={set} say={say} />
    <Quick st={st} setTo={setTo} go={go} />
    <Week txs={st.txs} />
    <section><div className="between"><h2>Recent activity</h2>{st.txs.length > 0 && <button className="link" onClick={() => go('activity')}>See all</button>}</div>
      {st.txs.length === 0 && <div className="empty center"><span className="ic big"><I n="list" /></span><p className="muted small">No activity yet. Add test funds to try a payment.</p></div>}
      {st.txs.slice(0, 4).map(t => <TxRow key={t.id} t={t} onClick={() => setSel(t)} />)}</section>
    {sel && <Sheet t={sel} close={() => setSel(null)} />}
    <Nav on="home" go={go} />
  </>)
}

function Activity({ st, go }) {
  const [f, setF] = useState('all'), [sel, setSel] = useState(null)
  const list = st.txs.filter(t => f === 'all' || (f === 'out') === (t.type === 'out'))
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
  const n = parseFloat(amt) || 0
  const err = !id ? '' : me ? 'You cannot send to yourself' : !rec ? 'No account found with that Pay ID' : n > st.balance ? 'Amount is more than your balance' : ''
  const ok = rec && !me && n > 0 && n <= st.balance
  return (<>
    <div className="top"><Back go={go} /><h1>Send</h1></div>
    <div className="field"><label htmlFor="t" className="muted small">To</label>
      <input id="t" className="in" value={to} onChange={e => setTo(e.target.value)} placeholder="@adeola" autoComplete="off" autoCapitalize="none" spellCheck="false" />
      <div role="status" style={{ minHeight: 32 }}>
        {rec && !me && <div className="top" style={{ gap: 10 }}><Av name={rec.name} size={32} /><b style={{ fontWeight: 500 }}>{rec.name}</b><span className="mono muted">{short(rec.addr)}</span></div>}
        {err && <p className="err">{err}</p>}</div></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 52 }}>${amt || '0'}</div><p className="muted small">Available {money(st.balance)}</p></div>
    <input className="in slim" aria-label="Note (optional)" value={note} maxLength={60} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
    <div className="seg small-seg">{[5, 10, 25, 50].map(v => <button key={v} onClick={() => setAmt(String(v))}>${v}</button>)}<button onClick={() => setAmt(String(st.balance))}>Max</button></div>
    <Keys on={k => setAmt(a => press(a, k))} />
    <button className="btn" disabled={!ok} onClick={() => go('review')}>Review</button>
  </>)
}

function Review({ st, set, go, to, amt, setLast, note }) {
  const id = clean(to), rec = chain.lookup(st, id), n = parseFloat(amt)
  const [busy, setBusy] = useState(false)
  const [e, setE] = useState('')
  if (!rec || !(n > 0)) return <><p>Nothing to review.</p><button className="btn" onClick={() => go('send')}>Back to send</button></>
  const send = async () => {
    if (st.settings.frozen) return go('blocked')
    setBusy(true); setE('')
    try { const t = await chain.send(st, id, n, note); set(s => chain.apply(s, t)); setLast(t); go('done') }
    catch (x) { setE(x.message || 'Payment failed. Try again.'); setBusy(false) }
  }
  return (<>
    <div className="top"><Back go={go} to="send" /><h1>Review payment</h1></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 48 }}>{money(n)}</div><p className="muted">to @{id}</p></div>
    <div><R k="Name" v={rec.name} /><R k="Address" v={short(rec.addr)} mono /><R k="Network fee" v="None in demo mode" />{note && <R k="Note" v={note} />}</div>
    <div className="box"><b>Who can see this (when live)</b>
      <span><b>The public:</b> nothing</span><span><b>You and {rec.name}:</b> amount and names</span><span><b>Compliance partner:</b> details, for safety checks</span></div>
    {e && <p className="err" role="alert">{e}</p>}
    <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
      <button className="btn" disabled={busy} onClick={send}>{busy ? 'Sending…' : `Send ${money(n)}`}</button>
      <button className="btn sec" disabled={busy} onClick={() => go('send')}>Cancel</button></div>
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
  const n = parseFloat(amt) || 0
  if (made) return (<>
    <div className="top"><Back go={() => setMade(false)} /><h1>Your request</h1></div>
    <PayCard u={st.user} set={set} say={say} amt={n} note={note} />
    <p className="muted small center">Whoever opens this link or scans the code gets a payment screen with the amount filled in.</p>
    <button className="btn sec" onClick={() => go('home')} style={{ marginTop: 'auto' }}>Done</button>
  </>)
  return (<>
    <div className="top"><Back go={go} /><h1>Request money</h1></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 52 }}>${amt || '0'}</div><p className="muted small">How much do you want to receive?</p></div>
    <input className="in slim" aria-label="Note (optional)" value={note} maxLength={60} onChange={e => setN(e.target.value)} placeholder="What is it for? (optional)" />
    <Keys on={k => setA(a => press(a, k))} />
    <button className="btn" disabled={!(n > 0)} onClick={() => setMade(true)}>Create request</button>
  </>)
}

function Settings({ st, set, go }) {
  const s = st.settings
  const [name, setName] = useState(st.user.name)
  const tog = (k, l) => <label className="tog"><span>{l}</span><input type="checkbox" role="switch" checked={!!s[k]} onChange={e => set(x => ({ ...x, settings: { ...x.settings, [k]: e.target.checked } }))} /></label>
  const reset = msg => { if (confirm(msg)) { set(() => chain.fresh()); go('welcome') } }
  return (<>
    <h1>Settings</h1>
    <section className="grp"><h2>Profile</h2>
      <div className="field"><label htmlFor="n" className="muted small">Display name</label>
        <input id="n" className="in" value={name} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && set(x => ({ ...x, user: { ...x.user, name: name.trim() } }))} /></div>
      <R k="Pay ID" v={'@' + st.user.payId} /></section>
    <section className="grp"><h2>Privacy</h2>{tog('hide', 'Hide balance')}
      <details><summary>What is private?</summary><p>When live, private transfers are designed to be hidden from the public, while you, the recipient and a compliance partner can see details. Deposits and cash-outs are public steps. This demo does not use a blockchain.</p></details></section>
    <section className="grp"><h2>Notifications</h2>{tog('recv', 'Payments received')}{tog('sent', 'Payments sent')}{tog('sec', 'Security alerts')}{tog('news', 'Product news')}
      <p className="muted small">Preferences are saved. Alerts start when the real app launches.</p></section>
    <section className="grp off"><h2>Security</h2><R k="Passkey" v="Coming soon" /><R k="App lock" v="Coming soon" /><R k="Recovery method" v="Coming soon" /></section>
    <section className="grp"><h2>Demo tools</h2>{tog('frozen', 'Simulate a paused account')}</section>
    <section className="grp"><h2>About</h2><R k="Version" v="0.4.0 (demo)" /><R k="Network" v="None. Demo mode." />
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
