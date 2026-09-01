import { defineConfig } from '@stackflow/config'

import type {
  AccountRecoveryStep,
  SignupAccountStep,
  SignupCredentialsStep,
  SignupPinStep,
} from '../features/auth/constants'

declare module '@stackflow/config' {
  interface Register {
    Home: {}
    My: {}
    Detail: {
      id: string
    }
    Trade: {
      tradeId?: string
      splitGroupId?: string
      focusLeg?: string
    }
    TradeCompose: {
      side: 'BUY' | 'SELL'
    }
    MatchingWaiting: {
      buyOrderId: string
      tradeId?: string
      requestedAmountKrw?: number
      initialPhase?: 'searching' | 'matched' | 'expired'
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
      name: 'Detail',
      route: '/detail/:id',
    },
    {
      name: 'TradeCompose',
      route: '/trade/compose',
    },
    {
      name: 'MatchingWaiting',
      route: '/trade/matching/:buyOrderId',
    },
    {
      name: 'SellOrderDetail',
      route: '/trade/sell/:sellOrderId',
    },
    {
      name: 'Trade',
      route: '/trade',
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
      name: 'SecuritySettings',
      route: '/auth/security',
    },
    {
      name: 'NotificationSettings',
      route: '/auth/notifications',
    },
    {
      name: 'NotificationCenter',
      route: '/notifications',
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
