import { useEffect } from 'react'

/**
 * 탭이 hidden → visible로 바뀌면 콜백을 호출합니다.
 * 폴링 화면의 즉시 재조회용.
 */
export function useOnDocumentVisible(onVisible: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onVisible()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, onVisible])
}
