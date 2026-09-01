import { useMemo, type ReactNode } from 'react'

import { detectRuntimeEnvironment } from '../../features/pwa/services/detectDeviceContext'
import { getKeyboardPolicy } from '../../shared/keyboard/keyboardPolicy'
import {
  KeyboardInsetContext,
  useKeyboardInsetController,
} from '../../shared/hooks/useKeyboardInset'

interface KeyboardInsetProviderProps {
  children: ReactNode
}

/**
 * OS·기능 감지 기반 키보드 inset.
 * DeviceContext와 독립 — detectRuntimeEnvironment() 동기 호출.
 */
export function KeyboardInsetProvider({ children }: KeyboardInsetProviderProps) {
  const environment = useMemo(() => detectRuntimeEnvironment(), [])
  const policy = useMemo(() => getKeyboardPolicy(environment), [environment])
  const inset = useKeyboardInsetController(policy.strategy)

  return (
    <KeyboardInsetContext.Provider value={inset}>{children}</KeyboardInsetContext.Provider>
  )
}
