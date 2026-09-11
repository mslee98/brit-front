/**
 * TransactionsActivity — 거래내역 탭 루트.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { AppBar, AppBarMain, AppBarRight } from 'seed-design/ui/app-bar'
import { AppScreen, AppScreenContent } from 'seed-design/ui/app-screen'

import { TransactionsScreen } from '../features/transactions/components/TransactionsScreen'

const TransactionsActivity: ActivityComponentType<'Transactions'> = () => {
  return (
    <AppScreen className="flex min-h-0 flex-1 flex-col">
      <AppBar>
        <AppBarMain title="거래내역" />
        <AppBarRight />
      </AppBar>
      <AppScreenContent className="min-h-0 flex-1 overflow-y-auto">
        <TransactionsScreen />
      </AppScreenContent>
    </AppScreen>
  )
}

export default TransactionsActivity
