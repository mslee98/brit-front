/**
 * TransactionDetailActivity — 거래 한 건. 목록의 Coin 부호를 그대로 보여 준다.
 */
import type { ActivityComponentType } from '@stackflow/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { TransactionDetailScreen } from '../features/transactions/components/TransactionDetailScreen'
import { useTransactionDetailScreen } from '../features/transactions/hooks/useTransactionDetailScreen'
import '../features/transactions/transaction-history.css'

const TransactionDetailActivity: ActivityComponentType<'TransactionDetail'> = () => {
  const screen = useTransactionDetailScreen()

  return (
    <ActivityScreenLayout title="거래 상세">
      <TransactionDetailScreen item={screen.item} onInquiry={screen.handleInquiry} />
    </ActivityScreenLayout>
  )
}

export default TransactionDetailActivity
