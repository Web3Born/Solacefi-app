import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import * as chain from './chain.js'

const P = {
  up: 'M7 17L17 7M8 7h9v9', down: 'M17 7L7 17M16 17H7V8', plus: 'M12 5v14M5 12h14', back: 'M15 6l-6 6 6 6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6h-6',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM4 12h2M18 12h2M12 4v2M12 18v2', check: 'M5 12l5 5L20 7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  lock: 'M5 11h14v10H5zM8 11V8a4 4 0 018 0v3', alert: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v6M12 16.5h.01'
}
const I = ({ n, s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
const money = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const short = a => a.slice(0, 8) + '…' + a.slice(-4)
const when = t => { const d = Math.floor((Date.now() - t) / 864e5); return d < 1 ? 'Today' : d < 2 ? 'Yesterday' : new Date(t).toLocaleDateString() }
const nm = c => c.includes('@') ? c.split('@')[0].replace(/^./, x => x.toUpperCase()) : 'Friend'
const clean = v => v.toLowerCase().replace(/^@/, '').trim()
const Logo = () => <span className="logo"><img src="/logo-mark.png" alt="" /><span>Solace<b>Fi</b></span></span>
const Back = ({ go, to = 'home' }) => <button className="back" aria-label="Back" onClick={() => go(to)}><I n="back" s={20} /></button>
const Nav = ({ on, go }) => (
  <nav className="nav" aria-label="Main">
    {[['home', 'Home', 'home'], ['receive', 'Receive', 'qr'], ['settings', 'Settings', 'gear']].map(([k, l, i]) =>
      <button key={k} className={on === k ? 'on' : ''} aria-current={on === k ? 'page' : undefined} onClick={() => go(k)}><I n={i} />{l}</button>)}
  </nav>
)
const R = ({ k, v, mono }) => <div className="row between"><span className="muted">{k}</span><span className={mono ? 'mono' : ''}>{v}</span></div>

export default function App() {
  const [st, setSt] = useState(chain.load)
  const [scr, setScr] = useState(() => chain.load().user?.payId ? 'home' : 'welcome')
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [last, setLast] = useState(null)
  const set = fn => setSt(s => { const n = fn(s); chain.save(n); return n })
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('pay')
    if (q && st.user?.payId) { setTo('@' + clean(q)); setScr('send') }
  }, [])
  const p = { st, set, go: setScr, to, setTo, amt, setAmt, last, setLast }
  const S = { welcome: Welcome, payid: PayId, ready: Ready, home: Home, send: Send, review: Review, done: Done, receive: Receive, settings: Settings, blocked: Blocked }[scr]
  return <main className="app"><S {...p} /></main>
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

function PayCard({ u }) {
  const [qr, setQr] = useState('')
  const [msg, setMsg] = useState('')
  const link = `${location.origin}/?pay=${u.payId}`
  useEffect(() => { QRCode.toDataURL(link, { margin: 1, width: 360 }).then(setQr).catch(() => {}) }, [link])
  const copy = async () => { try { await navigator.clipboard.writeText('@' + u.payId); setMsg('Pay ID copied') } catch { setMsg('Copy is not available here') } }
  const share = async () => {
    try { if (navigator.share) await navigator.share({ title: 'Pay me on SolaceFi', url: link }); else { await navigator.clipboard.writeText(link); setMsg('Link copied') } } catch {}
  }
  return (
    <div className="card center">
      <div className="num" style={{ fontSize: 36 }}>@{u.payId}</div>
      {qr && <img className="qr" src={qr} alt={`QR code for @${u.payId}`} />}
      <div className="two"><button className="btn sec" onClick={copy}>Copy Pay ID</button><button className="btn sec" onClick={share}>Share link</button></div>
      <p className="small muted" role="status">{msg}</p>
    </div>
  )
}

function Ready({ st, go }) {
  const u = st.user
  return (<>
    <div className="center"><span className="okc"><I n="check" s={28} /></span><h1>You are all set</h1><p className="muted">Share your Pay ID to get paid.</p></div>
    <PayCard u={u} />
    <R k="Wallet address (demo)" v={short(u.address)} mono />
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => go('home')}>Go to home</button>
  </>)
}

function Home({ st, set, go }) {
  const h = st.settings.hide
  return (<>
    <div className="between"><div><p className="muted small">Hello</p><h2 style={{ fontSize: 24 }}>{st.user.name}</h2></div><span className="tag">Demo mode</span></div>
    <div className="card">
      <div className="between"><span className="small" style={{ color: '#a9c9c1' }}>Balance</span>
        <button className="eye" aria-label={h ? 'Show balance' : 'Hide balance'} onClick={() => set(s => ({ ...s, settings: { ...s.settings, hide: !h } }))}><I n="eye" /></button></div>
      <div className="num">{h ? '$••••' : money(st.balance)}</div>
      <p className="small" style={{ color: '#a9c9c1' }}>Test funds, not real money</p>
      <span className="chip"><I n="alert" /> Demo: no blockchain connected yet</span>
    </div>
    <div className="acts">
      <button className="act p" onClick={() => go('send')}><span><I n="up" s={24} /></span>Send</button>
      <button className="act" onClick={() => go('receive')}><span><I n="down" s={24} /></span>Receive</button>
      <button className="act" onClick={() => set(s => chain.fund(s, 100))}><span><I n="plus" s={24} /></span>Add test funds</button>
    </div>
    <section><h2 style={{ marginBottom: 8 }}>Recent activity</h2>
      {st.txs.length === 0 && <p className="muted small">No activity yet. Add test funds to try a payment.</p>}
      {st.txs.slice(0, 8).map(t => (
        <div className="row" key={t.id}><span className="ic"><I n={t.type === 'out' ? 'up' : t.type === 'in' ? 'down' : 'plus'} s={18} /></span>
          <div style={{ flex: 1 }}><div>{t.label}</div><div className="muted small">{when(t.ts)}</div></div>
          <b className={'num amt ' + (t.type === 'out' ? '' : 'pos')}>{t.type === 'out' ? '-' : '+'}{money(t.amount)}</b></div>))}
    </section>
    <Nav on="home" go={go} />
  </>)
}

function Send({ st, go, to, setTo, amt, setAmt }) {
  const id = clean(to)
  const rec = id ? chain.lookup(st, id) : null
  const me = id && id === st.user.payId
  const n = parseFloat(amt) || 0
  const err = !id ? '' : me ? 'You cannot send to yourself' : !rec ? 'No account found with that Pay ID' : n > st.balance ? 'Amount is more than your balance' : ''
  const ok = rec && !me && n > 0 && n <= st.balance
  const key = k => setAmt(a => k === '←' ? a.slice(0, -1) : k === '.' ? (a.includes('.') ? a : (a || '0') + '.') : /\.\d{2}$/.test(a) ? a : a === '0' ? k : a + k)
  return (<>
    <div className="top"><Back go={go} /><h1>Send</h1></div>
    <div className="field"><label htmlFor="t" className="muted small">To</label>
      <input id="t" className="in" value={to} onChange={e => setTo(e.target.value)} placeholder="@adeola" autoComplete="off" autoCapitalize="none" spellCheck="false" />
      <div role="status" style={{ minHeight: 32 }}>
        {rec && !me && <div className="top" style={{ gap: 10 }}><span className="av">{rec.name[0]}</span><b style={{ fontWeight: 500 }}>{rec.name}</b><span className="mono muted">{short(rec.addr)}</span></div>}
        {err && <p className="err">{err}</p>}</div></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 52 }}>${amt || '0'}</div><p className="muted small">Available {money(st.balance)}</p></div>
    <div className="keys">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'].map(k => <button key={k} aria-label={k === '←' ? 'Delete' : k} onClick={() => key(k)}>{k}</button>)}</div>
    <button className="btn" disabled={!ok} onClick={() => go('review')}>Review</button>
  </>)
}

function Review({ st, set, go, to, amt, setLast }) {
  const id = clean(to), rec = chain.lookup(st, id), n = parseFloat(amt)
  const [busy, setBusy] = useState(false)
  const [e, setE] = useState('')
  if (!rec || !(n > 0)) return <><p>Nothing to review.</p><button className="btn" onClick={() => go('send')}>Back to send</button></>
  const send = async () => {
    if (st.settings.frozen) return go('blocked')
    setBusy(true); setE('')
    try { const t = await chain.send(st, id, n); set(s => chain.apply(s, t)); setLast(t); go('done') }
    catch (x) { setE(x.message || 'Payment failed. Try again.'); setBusy(false) }
  }
  return (<>
    <div className="top"><Back go={go} to="send" /><h1>Review payment</h1></div>
    <div className="center" style={{ gap: 2 }}><div className="num" style={{ fontSize: 48 }}>{money(n)}</div><p className="muted">to @{id}</p></div>
    <div><R k="Name" v={rec.name} /><R k="Address" v={short(rec.addr)} mono /><R k="Network fee" v="None in demo mode" /></div>
    <div className="box"><b>Who can see this (when live)</b>
      <span><b>The public:</b> nothing</span><span><b>You and {rec.name}:</b> amount and names</span><span><b>Compliance partner:</b> details, for safety checks</span></div>
    {e && <p className="err" role="alert">{e}</p>}
    <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
      <button className="btn" disabled={busy} onClick={send}>{busy ? 'Sending…' : `Send ${money(n)}`}</button>
      <button className="btn sec" disabled={busy} onClick={() => go('send')}>Cancel</button></div>
  </>)
}

function Done({ go, last, setAmt, setTo }) {
  if (!last) return <button className="btn" onClick={() => go('home')}>Home</button>
  return (<>
    <div className="center" style={{ marginTop: 40 }}><span className="okc"><I n="check" s={28} /></span><h1>Payment sent</h1>
      <p className="muted">{money(last.amount)} to @{last.to}</p></div>
    <div><R k="Receipt" v={last.id} mono /><R k="Time" v={new Date(last.ts).toLocaleString()} /><R k="Mode" v="Demo, no blockchain" /></div>
    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => { setAmt(''); setTo(''); go('home') }}>Done</button>
  </>)
}

function Receive({ st, go }) {
  return (<>
    <div className="top"><Back go={go} /><h1>Receive</h1></div>
    <PayCard u={st.user} />
    <p className="muted small center">Anyone with your Pay ID can send you money.</p>
    <Nav on="receive" go={go} />
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
    <section className="grp"><h2>About</h2><R k="Version" v="0.1.0 (demo)" /><R k="Network" v="None. Demo mode." />
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
