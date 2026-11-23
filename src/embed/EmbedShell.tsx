import type { ReactNode } from 'react'
import {
  IconChevronLeftLine,
  IconXmarkLine,
} from '@karrotmarket/react-monochrome-icon'

import LogoBrit from '../assets/icons/brand/logo-brit.svg?react'

type EmbedShellProps = {
  children: ReactNode
  footer?: ReactNode
  stickyFooter?: boolean
  onClose?: () => void
  closeDisabled?: boolean
  closeLabel?: string
  /** 헤더 중앙 타이틀 (있으면 로고 대신 표시) */
  title?: string
  onBack?: () => void
  backDisabled?: boolean
  backLabel?: string
}

/**
 * 토스 위젯형 풀시트 셸 — 헤더(로고 또는 뒤로+타이틀+닫기) + 본문 + 선택 푸터.
 */
export function EmbedShell({
  children,
  footer,
  stickyFooter = false,
  onClose,
  closeDisabled,
  closeLabel = '닫기',
  title,
  onBack,
  backDisabled,
  backLabel = '뒤로',
}: EmbedShellProps) {
  const showNav = Boolean(title || onBack)

  return (
    <div className="embed-sheet">
      <header className="embed-sheet__header">
        {showNav ? (
          <>
            {onBack ? (
              <button
                type="button"
                className="embed-sheet__nav-btn"
                aria-label={backLabel}
                disabled={backDisabled}
                onClick={onBack}
              >
                <IconChevronLeftLine width={22} height={22} />
              </button>
            ) : (
              <span className="embed-sheet__nav-spacer" aria-hidden />
            )}
            {title ? (
              <h1 className="embed-sheet__title">{title}</h1>
            ) : (
              <span className="embed-sheet__title" aria-hidden />
            )}
          </>
        ) : (
          <div className="embed-sheet__brand" aria-label="BRIT">
            <LogoBrit className="embed-sheet__logo" aria-hidden />
          </div>
        )}
        {onClose ? (
          <button
            type="button"
            className="embed-sheet__nav-btn"
            aria-label={closeLabel}
            disabled={closeDisabled}
            onClick={onClose}
          >
            <IconXmarkLine width={22} height={22} />
          </button>
        ) : (
          <span className="embed-sheet__nav-spacer" aria-hidden />
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
