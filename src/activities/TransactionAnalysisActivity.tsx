/**
 * TransactionAnalysisActivity — 월간 거래 구성. 유입·유출 두 톤만 쓴다.
 */
import type { ActivityComponentType } from '@stackflow/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { TransactionAnalysisScreen } from '../features/transactions/components/TransactionAnalysisScreen'
import { useTransactionAnalysisScreen } from '../features/transactions/hooks/useTransactionAnalysisScreen'
import '../features/transactions/transaction-history.css'

const TransactionAnalysisActivity: ActivityComponentType<'TransactionAnalysis'> = () => {
  const screen = useTransactionAnalysisScreen()

  return (
    <ActivityScreenLayout title="거래 분석">
      <TransactionAnalysisScreen
        month={screen.month}
        amounts={screen.amounts}
        previousVolume={screen.previousVolume}
        monthPickerOpen={screen.monthPickerOpen}
        onOpenMonthPicker={screen.openMonthPicker}
        onMonthPickerOpenChange={screen.setMonthPickerOpen}
        onMonthSelect={screen.handleMonthSelect}
      />
    </ActivityScreenLayout>
  )
}

export default TransactionAnalysisActivity
