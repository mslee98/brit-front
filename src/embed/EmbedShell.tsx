import type { ReactNode } from 'react'
import { IconXmarkLine } from '@karrotmarket/react-monochrome-icon'

import LogoBrit from '../assets/icons/brand/logo-brit.svg?react'

type EmbedShellProps = {
  children: ReactNode
  footer?: ReactNode
  stickyFooter?: boolean
  onClose?: () => void
  closeDisabled?: boolean
  closeLabel?: string
}

/**
 * 토스 위젯형 풀시트 셸 — 헤더(로고+닫기) + 본문 + 선택 푸터.
 */
export function EmbedShell({
  children,
  footer,
  stickyFooter = false,
  onClose,
  closeDisabled,
  closeLabel = '닫기',
}: EmbedShellProps) {
  return (
    <div className="embed-sheet">
      <header className="embed-sheet__header">
        <div className="embed-sheet__brand" aria-label="BRIT">
          <LogoBrit className="embed-sheet__logo" aria-hidden />
        </div>
        {onClose ? (
          <button
            type="button"
            className="embed-sheet__close"
            aria-label={closeLabel}
            disabled={closeDisabled}
            onClick={onClose}
          >
            <IconXmarkLine width={22} height={22} />
          </button>
        ) : (
          <span style={{ width: 44 }} aria-hidden />
        )}
      </header>
      <div className="embed-sheet__body">{children}</div>
      {footer ? (
        <div
          className={
            stickyFooter
              ? 'embed-sheet__footer embed-sheet__footer--sticky'
              : 'embed-sheet__footer'
          }
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
