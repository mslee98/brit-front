import { useCallback, useEffect, useState } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { fetchTransactionDetail } from '../api/transactions.api'
import type { TransactionDetail } from '../types'
import { isOpenStatus } from '../utils/coinFlow'

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; item: TransactionDetail }

/**
 * useTransactionDetailScreen — 거래 한 건 상세.
 * 진행 중 P2P 거래는 거래 화면으로 보내고, 끝난 건은 문의(준비 중) 안내를 보여 준다.
 */
export function useTransactionDetailScreen() {
  const { transactionId } = useActivityParams<'TransactionDetail'>()
  const { push } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [loaded, setLoaded] = useState<{ id: string; state: DetailState } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchTransactionDetail(transactionId, controller.signal)
      .then((item) => setLoaded({ id: transactionId, state: { status: 'ready', item } }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ id: transactionId, state: { status: 'error' } })
      })
    return () => controller.abort()
  }, [attempt, transactionId])

  const state: DetailState = loaded?.id === transactionId ? loaded.state : { status: 'loading' }
  const item = state.status === 'ready' ? state.item : null
  const canOpenTrade = item != null && item.tradeId != null && isOpenStatus(item.status)

  const handleInquiry = useCallback(() => {
    showSnackbar(snackbar, '문의는 준비 중이에요.', 'default', { actionLabel: '닫기' })
  }, [snackbar])

  const openTrade = useCallback(() => {
    if (!item?.tradeId) return
    push('Trade', { tradeId: item.tradeId }, { animate: true })
  }, [item, push])

  return {
    state,
    canOpenTrade,
    handleInquiry,
    openTrade,
    retry: () => setAttempt((value) => value + 1),
  }
}
