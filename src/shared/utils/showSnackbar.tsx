import { createElement } from 'react'
import { Snackbar, type useSnackbarAdapter } from 'seed-design/ui/snackbar'

type SnackbarAdapter = ReturnType<typeof useSnackbarAdapter>

export type ShowSnackbarVariant = 'positive' | 'critical' | 'default'

export type ShowSnackbarOptions = {
  /**
   * 보조 Action 라벨.
   * 기본값 '닫기'. DS 가이드상 '확인'/'취소'보다 구체적 단어를 권장.
   * Action을 숨기려면 null.
   */
  actionLabel?: string | null
  onAction?: () => void
  /** @default true */
  shouldCloseOnAction?: boolean
}

const DEFAULT_DISMISS_ACTION_LABEL = '닫기'

/**
 * SEED Snackbar 표시.
 * 기본으로 dismiss Action('닫기')을 붙인다. 숨기려면 actionLabel: null.
 */
export function showSnackbar(
  adapter: SnackbarAdapter,
  message: string,
  variant: ShowSnackbarVariant = 'positive',
  options?: ShowSnackbarOptions,
) {
  const actionLabel =
    options?.actionLabel === null
      ? undefined
      : (options?.actionLabel ?? DEFAULT_DISMISS_ACTION_LABEL)

  adapter.create({
    render: () =>
      createElement(Snackbar, {
        variant,
        message,
        actionLabel,
        onAction: options?.onAction,
        shouldCloseOnAction: options?.shouldCloseOnAction,
      }),
  })
}
