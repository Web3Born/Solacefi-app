// App lock helpers. The PIN is never stored: only a salted PBKDF2 hash, on this device.
// This protects the app screen from someone picking up the phone. It is not wallet-key encryption.
const K = 'solacefi.lock'
const b64 = u => btoa(String.fromCharCode(...new Uint8Array(u)))
const un = s => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const derive = async (pin, salt) => crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']), 256)
export const loadLock = () => { try { return JSON.parse(localStorage.getItem(K)) } catch { return null } }
export const saveLock = l => { try { l ? localStorage.setItem(K, JSON.stringify(l)) : localStorage.removeItem(K) } catch {} }
export const makeLock = async (pin, after = 60) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { salt: b64(salt), hash: b64(await derive(pin, salt)), after, fails: 0, until: 0 }
}
export const check = async (l, pin) => b64(await derive(pin, un(l.salt))) === l.hash
export const weak = p => /^(\d)\1+$/.test(p) || '0123456789'.includes(p) || '9876543210'.includes(p)
export const failed = l => { const f = l.fails + 1; return { ...l, fails: f, until: f >= 5 ? Date.now() + Math.min(30000 * 2 ** (f - 5), 900000) : 0 } }
export const cleared = l => ({ ...l, fails: 0, until: 0 })
