import { useCallback } from 'react'
import { useActivityParams } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { findHistoryTransaction } from '../mocks/history.mock'

/**
 * useTransactionDetailScreen — 거래 한 건의 Coin 기준 상세.
 * 문의 이동은 아직 없어서 안내만 보여 준다.
 */
export function useTransactionDetailScreen() {
  const { transactionId } = useActivityParams<'TransactionDetail'>()
  const snackbar = useSnackbarAdapter()
  const item = findHistoryTransaction(transactionId) ?? null

  const handleInquiry = useCallback(() => {
    showSnackbar(snackbar, '문의는 준비 중이에요.', 'default', { actionLabel: '닫기' })
  }, [snackbar])

  return { item, handleInquiry }
}
