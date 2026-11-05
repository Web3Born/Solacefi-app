// Real Aleo TESTNET wallet through a Dynamic embedded wallet (email login, wallet created for the user).
// Written from Dynamic's public Aleo docs. Not tested against the live service yet: expect to fix small things on first run.
// The SDK is loaded only when this screen is used, and nothing happens unless VITE_DYNAMIC_ENV_ID is set.
const ENV = import.meta.env.VITE_DYNAMIC_ENV_ID
const O = () => (typeof window !== 'undefined' ? window.__SOLACE_ALEO__ : undefined) // test hook
export const configured = () => !!O() || !!ENV
export const isAddress = a => /^aleo1[a-z0-9]{58}$/.test(a || '')
const toMicro = c => { const [w = '0', f = ''] = String(c).split('.'); return BigInt(w || '0') * 1000000n + BigInt((f + '000000').slice(0, 6) || '0') }
let sdk, otp
const load = () => {
  if (!sdk) {
    sdk = (async () => {
      const c = await import('@dynamic-labs-sdk/client')
      const core = await import('@dynamic-labs-sdk/client/core')
      const waas = await import('@dynamic-labs-sdk/client/waas')
      const al = await import('@dynamic-labs-sdk/aleo')
      const alw = await import('@dynamic-labs-sdk/aleo/waas')
      c.createDynamicClient({ autoInitialize: false, environmentId: ENV, metadata: { name: 'SolaceFi', universalLink: location.origin } })
      alw.addWaasAleoExtension()
      await c.initializeClient()
      return { c, core, waas, al }
    })()
    sdk.catch(() => { sdk = null })
  }
  return sdk
}
const wallet = async () => {
  const { c, core, al } = await load()
  const walletAccount = c.getWalletAccounts().find(al.isAleoWalletAccount)
  if (!walletAccount) return null
  const walletProvider = core.getWalletProviderFromWalletAccount({ walletAccount })
  return al.isAleoWalletProvider(walletProvider) ? { walletAccount, walletProvider } : null
}
export const status = async () => {
  if (O()) return O().status()
  const w = await wallet(); return { signedIn: !!w, address: w?.walletAccount.address }
}
export const sendCode = async email => { if (O()) return O().sendCode(email); const { c } = await load(); otp = await c.sendEmailOTP({ email }) }
export const verifyCode = async code => {
  if (O()) return O().verifyCode(code)
  const { c, waas } = await load()
  await c.verifyOTP({ otpVerification: otp, verificationToken: code })
  const missing = waas.getChainsMissingWaasWalletAccounts()
  if (missing.length) await waas.createWaasWalletAccounts({ chains: missing })
  return status()
}
export const network = async () => {
  if (O()) return O().network()
  const w = await wallet(); const { networkId } = await w.walletProvider.getActiveNetworkId(); return Number(networkId) === 1 ? 'testnet' : 'mainnet'
}
export const balances = async () => {
  if (O()) return O().balances()
  const { c } = await load(); const w = await wallet()
  const { balance } = await c.getNativeBalance({ walletAccount: w.walletAccount })
  const { records } = (await w.walletProvider.requestRecords?.({ options: { plaintext: true }, program: 'credits.aleo', walletAccount: w.walletAccount })) ?? { records: [] }
  const micro = records.filter(r => typeof r === 'string').map(r => Number(/microcredits:\s*(\d+)u64/.exec(r)?.[1] || 0))
  return { pub: Number(balance || 0), priv: micro.reduce((a, b) => a + b, 0) / 1e6, largest: Math.max(0, ...micro) / 1e6, records: micro.length }
}
const tx = async (transitions, fee = 0) => {
  const w = await wallet(); const { networkId } = await w.walletProvider.getActiveNetworkId()
  if (Number(networkId) !== 1) throw new Error('This build only works on Aleo testnet. Mainnet is switched off.')
  const { transactionId } = await w.walletProvider.requestTransaction({ transaction: { address: w.walletAccount.address, chainId: networkId, fee, feePrivate: false, transitions }, walletAccount: w.walletAccount })
  const { al } = await load()
  return { txId: transactionId, url: al.getAleoExplorerTxUrl({ networkId, txId: transactionId }) }
}
export const sendPrivate = async (to, amount) => {
  if (O()) return O().sendPrivate(to, amount)
  if (!isAddress(to)) throw new Error('That is not a valid Aleo address')
  const need = toMicro(amount); const w = await wallet()
  const { records } = (await w.walletProvider.requestRecords?.({ options: { plaintext: true }, program: 'credits.aleo', walletAccount: w.walletAccount })) ?? { records: [] }
  const rec = records.filter(r => typeof r === 'string').find(r => BigInt(/microcredits:\s*(\d+)u64/.exec(r)?.[1] || 0) >= need)
  if (!rec) throw new Error('No single private record covers this amount. Try a smaller amount or move more funds to private first.')
  return tx([{ program: 'credits.aleo', functionName: 'transfer_private', inputs: [rec, to, `${need}u64`], inputTypes: ['credits.record', 'address.private', 'u64.private'] }])
}
export const shield = async amount => {
  if (O()) return O().shield(amount)
  const w = await wallet()
  return tx([{ program: 'credits.aleo', functionName: 'transfer_public_to_private', inputs: [w.walletAccount.address, `${toMicro(amount)}u64`], inputTypes: ['address.public', 'u64.public'] }])
}
export const signOut = async () => { if (O()) return O().signOut(); const { c } = await load(); await c.logout() }
