// Fingerprint / face unlock. Works only inside the installed Android app (Capacitor); on the web it reports "not available".
import { Capacitor } from '@capacitor/core'
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'
export const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }
export const bioAvailable = async () => { if (!isNative()) return false; try { return !!(await BiometricAuth.checkBiometry()).isAvailable } catch { return false } }
export const bioPrompt = async reason => {
  try { await BiometricAuth.authenticate({ reason, cancelTitle: 'Use PIN', allowDeviceCredential: false, androidTitle: 'Unlock SolaceFi', androidSubtitle: reason }); return true } catch { return false }
}
