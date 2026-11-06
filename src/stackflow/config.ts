import { defineConfig } from '@stackflow/config'

import type {
  AccountRecoveryStep,
  ChangeBankAccountStep,
  FindLoginIdStep,
  SignupAccountStep,
  SignupCredentialsStep,
  SignupPinStep,
  TransactionPinMode,
  TransactionPinStep,
} from '../features/auth/constants'

declare module '@stackflow/config' {
  interface Register {
    Home: {}
    My: {}
    Transactions: {}
    TransactionDetail: {
      transactionId: string
    }
    TransactionAnalysis: {
      year?: string
      month?: string
    }
    Store: {}
    Community: {}
    Trade: {
      tradeId?: string
      splitGroupId?: string
      focusLeg?: string
    }
    DisputeChat: {
      disputeId: string
    }
    TradeCompose: {
      side: 'BUY' | 'SELL'
    }
    Market: {}
    MatchingWaiting: {
      buyOrderId: string
      tradeId?: string
      requestedAmountKrw?: number
      initialPhase?: 'searching' | 'matched' | 'expired' | 'requestPending'
      tradeRequestId?: string
      tradeRequestExpiresAt?: string
      /** 거래소에서 Apply한 매도글 — pending UI 후보 복원용 */
      targetSellOrderId?: string
      /** 'market'이면 거절·만료·취소 시 후보 탐색 재개 대신 거래소로 복귀 */
      origin?: 'market'
    }
    SellOrderDetail: {
      sellOrderId: string
      /** 등록 직후 진입이면 created — Hero 완료 피드백용 */
      entryContext?: 'created' | 'history'
    }
    SignupTerms: {}
    SignupIdentity: {}
    SignupAccount: {
      step?: SignupAccountStep
    }
    SignupCredentials: {
      step?: SignupCredentialsStep
    }
    SignupPin: {
      step?: SignupPinStep
    }
    SignupComplete: {}
    RegistrationStatus: {
      mode?: 'wait' | 'resubmit'
    }
    Login: {}
    AccountSettings: {}
    ChangePassword: {}
    ChangeBankAccount: {
      step?: ChangeBankAccountStep
    }
    TransactionPin: {
      mode?: TransactionPinMode
      step?: TransactionPinStep
    }
    FindLoginId: {
      step?: FindLoginIdStep
    }
    SecuritySettings: {}
    NotificationSettings: {}
    NotificationCenter: {}
    AccountRecovery: {
      step?: AccountRecoveryStep
    }
    SmsSchemePoc: {}
    NotFound: {}
  }
}

/**
 * 새로고침·URL 직접 진입 시 historySync는 현재 화면 하나만 복원한다.
 * 허브·흐름 화면은 아래에 루트 탭을 깔아 뒤로가기가 앱 안에 머물게 한다.
 */
function under(root: 'Home' | 'Transactions' | 'My') {
  return () => ({
    entries: [{ activityName: root, activityParams: {} }],
    skipDefaultHistorySetupTransition: true,
  })
}

export const config = defineConfig({
  activities: [
    {
      name: 'Home',
      route: '/',
    },
    {
      name: 'My',
      route: '/my',
    },
    {
      name: 'Transactions',
      route: '/transactions',
    },
    {
      name: 'TransactionAnalysis',
      route: { path: '/transactions/analysis', defaultHistory: under('Transactions') },
    },
    {
      name: 'TransactionDetail',
      route: { path: '/transactions/detail/:transactionId', defaultHistory: under('Transactions') },
    },
    {
      name: 'Store',
      route: { path: '/store', defaultHistory: under('Home') },
    },
    {
      name: 'Community',
      route: { path: '/community', defaultHistory: under('Home') },
    },
    {
      name: 'TradeCompose',
      route: { path: '/trade/compose', defaultHistory: under('Home') },
    },
    {
      name: 'Market',
      route: { path: '/market', defaultHistory: under('Home') },
    },
    {
      name: 'MatchingWaiting',
      route: { path: '/trade/matching/:buyOrderId', defaultHistory: under('Home') },
    },
    {
      name: 'SellOrderDetail',
      route: { path: '/trade/sell/:sellOrderId', defaultHistory: under('Home') },
    },
    {
      name: 'Trade',
      route: { path: '/trade', defaultHistory: under('Home') },
    },
    {
      name: 'DisputeChat',
      route: { path: '/trade/dispute/:disputeId', defaultHistory: under('Home') },
    },
    {
      name: 'SignupTerms',
      route: '/auth/signup/terms',
    },
    {
      name: 'SignupIdentity',
      route: '/auth/signup/identity',
    },
    {
      name: 'SignupAccount',
      route: '/auth/signup/account',
    },
    {
      name: 'SignupCredentials',
      route: '/auth/signup/credentials',
    },
    {
      name: 'SignupPin',
      route: '/auth/signup/pin',
    },
    {
      name: 'SignupComplete',
      route: '/auth/signup/complete',
    },
    {
      name: 'RegistrationStatus',
      route: '/auth/registration-status',
    },
    {
      name: 'Login',
      route: '/auth/login',
    },
    {
      name: 'AccountSettings',
      route: { path: '/my/settings', defaultHistory: under('My') },
    },
    {
      name: 'ChangePassword',
      route: { path: '/my/password', defaultHistory: under('My') },
    },
    {
      name: 'ChangeBankAccount',
      route: { path: '/my/bank-account', defaultHistory: under('My') },
    },
    {
      name: 'TransactionPin',
      route: { path: '/my/pin', defaultHistory: under('My') },
    },
    {
      name: 'FindLoginId',
      route: '/auth/find-id',
    },
    {
      name: 'SecuritySettings',
      route: '/auth/security',
    },
    {
      name: 'NotificationSettings',
      route: '/auth/notifications',
    },
    {
      name: 'NotificationCenter',
      route: { path: '/notifications', defaultHistory: under('Home') },
    },
    {
      name: 'AccountRecovery',
      route: '/auth/recovery',
    },
    {
      name: 'SmsSchemePoc',
      route: '/poc/sms',
    },
    {
      name: 'NotFound',
      route: '/404',
    },
  ],
  transitionDuration: 300,
})
