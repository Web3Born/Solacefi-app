// App lock helpers. The PIN is never stored: only a salted PBKDF2 hash, on this device.
// This protects the app screen from someone picking up the phone. It is not wallet-key encryption.
const K = 'solacefi.lock'
const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u)))
const un = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const P = []; for (let n = 2; P.length < 64; n++) if (P.every(p => n % p)) P.push(n)
const fr = x => Math.floor((x % 1) * 4294967296)
const KS = P.map(p => fr(Math.cbrt(p))), H0 = P.slice(0, 8).map(p => fr(Math.sqrt(p)))
const rr = (x, n) => (x >>> n) | (x << (32 - n))
function sha256(m) { // pure-JS fallback for pages where crypto.subtle is unavailable (non-secure context)
  const l = m.length, n = ((l + 9 + 63) >> 6) << 6, buf = new Uint8Array(n); buf.set(m); buf[l] = 128
  const dv = new DataView(buf.buffer); dv.setUint32(n - 4, (l * 8) >>> 0); dv.setUint32(n - 8, Math.floor(l * 8 / 4294967296))
  let h = H0.slice(); const w = new Uint32Array(64)
  for (let i = 0; i < n; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4)
    for (let t = 16; t < 64; t++) { const x = w[t - 15], y = w[t - 2]; w[t] = (w[t - 16] + (rr(x, 7) ^ rr(x, 18) ^ (x >>> 3)) + w[t - 7] + (rr(y, 17) ^ rr(y, 19) ^ (y >>> 10))) >>> 0 }
    let [a, b, c, d, e, f, g, k] = h
    for (let t = 0; t < 64; t++) {
      const t1 = (k + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & g)) + KS[t] + w[t]) >>> 0
      const t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      k = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0
    }
    h = [a, b, c, d, e, f, g, k].map((v, j) => (h[j] + v) >>> 0)
  }
  const o = new Uint8Array(32), ov = new DataView(o.buffer); h.forEach((v, j) => ov.setUint32(j * 4, v)); return o
}
export { sha256 }
const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let i = 0; a.forEach(x => { o.set(x, i); i += x.length }); return o }
export const secure = () => typeof crypto !== 'undefined' && !!crypto.subtle
const derive = async (pin, salt, m) => {
  const pb = new TextEncoder().encode(pin)
  if (m === 's') return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, await crypto.subtle.importKey('raw', pb, 'PBKDF2', false, ['deriveBits']), 256))
  let h = sha256(cat(salt, pb)); for (let i = 0; i < 20000; i++) h = sha256(cat(h, salt, pb)); return h
}
export const loadLock = () => { try { return JSON.parse(localStorage.getItem(K)) } catch { return null } }
export const saveLock = l => { try { l ? localStorage.setItem(K, JSON.stringify(l)) : localStorage.removeItem(K) } catch {} }
export const makeLock = async (pin, after = 60) => {
  const salt = new Uint8Array(16); (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto.getRandomValues(salt) : salt.forEach((_, i) => salt[i] = Math.floor(Math.random() * 256))
  const m = secure() ? 's' : 'j'
  return { m, salt: b64(salt), hash: b64(await derive(pin, salt, m)), after, fails: 0, until: 0 }
}
export const check = async (l, pin) => { const m = l.m || 's'; if (m === 's' && !secure()) throw new Error('Open the app over https to unlock'); return b64(await derive(pin, un(l.salt), m)) === l.hash }
export const weak = p => /^(\d)\1+$/.test(p) || '0123456789'.includes(p) || '9876543210'.includes(p)
export const failed = l => { const f = l.fails + 1; return { ...l, fails: f, until: f >= 5 ? Date.now() + Math.min(30000 * 2 ** (f - 5), 900000) : 0 } }
export const cleared = l => ({ ...l, fails: 0, until: 0 })
