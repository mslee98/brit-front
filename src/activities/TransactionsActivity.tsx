/**
 * TransactionsActivity — 거래내역 탭 루트.
 * 하단 탭이라 뒤로가기는 없고, 오른쪽에서 필터를 연다.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text } from '@seed-design/react'
import { AppBar, AppBarMain, AppBarRight } from 'seed-design/ui/app-bar'
import { AppScreen, AppScreenContent } from 'seed-design/ui/app-screen'

import { TransactionHistoryScreen } from '../features/transactions/components/TransactionHistoryScreen'
import { useTransactionHistoryScreen } from '../features/transactions/hooks/useTransactionHistoryScreen'
import '../features/transactions/transaction-history.css'

const TransactionsActivity: ActivityComponentType<'Transactions'> = () => {
  const screen = useTransactionHistoryScreen()

  return (
    <AppScreen className="flex min-h-0 flex-1 flex-col">
      <AppBar>
        <AppBarMain title="거래내역" />
        <AppBarRight>
          <button
            type="button"
            className="tx-filter-button"
            aria-expanded={screen.filterOpen}
            onClick={screen.openFilter}
          >
            <Text textStyle="t5Medium" color={screen.filterActive ? 'fg.brand' : 'fg.neutral'}>
              필터
            </Text>
          </button>
        </AppBarRight>
      </AppBar>
      <AppScreenContent className="min-h-0 flex-1 overflow-y-auto">
        <TransactionHistoryScreen model={screen} />
      </AppScreenContent>
    </AppScreen>
  )
}

export default TransactionsActivity
