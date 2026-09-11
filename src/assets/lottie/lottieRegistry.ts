import successAnimation from './success.v1.json'

export type LottieAssetKey =
  | 'success'
  | 'moneyWindsLoop'
  | 'checkBlueSpot'
  | 'britBankMobileNotification'
  | 'coinDollarProtect'

export type LoadableLottieAssetKey = Exclude<LottieAssetKey, 'success'>

export const LOTTIE_ASSETS = {
  success: successAnimation,
} as const

const loadPromises = new Map<LoadableLottieAssetKey, Promise<object>>()

async function importLottieAsset(key: LoadableLottieAssetKey): Promise<object> {
  switch (key) {
    case 'moneyWindsLoop':
      return (await import('./money-winds-loop.v1.json')).default
    case 'checkBlueSpot':
      return (await import('./check-blue-spot.v1.json')).default
    case 'britBankMobileNotification':
      return (await import('./brit-bank-mobile-notification.v1.json')).default
    case 'coinDollarProtect':
      return (await import('./coin-dollar-protect.v1.json')).default
  }
}

/** dynamic import + promise 캐시. 동일 key는 한 번만 fetch. */
export function loadLottieAsset(key: LoadableLottieAssetKey): Promise<object> {
  const cached = loadPromises.get(key)
  if (cached) return cached

  const promise = importLottieAsset(key).catch((error) => {
    loadPromises.delete(key)
    throw error
  })
  loadPromises.set(key, promise)
  return promise
}

/** 화면 진입 전 워밍 — loadLottieAsset와 동일 캐시 공유 */
export function preloadLottieAsset(key: LoadableLottieAssetKey): void {
  void loadLottieAsset(key)
}
