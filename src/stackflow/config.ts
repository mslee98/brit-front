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
    Login: {}
    SecuritySettings: {}
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
      name: 'Detail',
      route: '/detail/:id',
    },
    {
      name: 'TradeCompose',
      route: '/trade/compose',
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
      name: 'Login',
      route: '/auth/login',
    },
    {
      name: 'SecuritySettings',
      route: '/auth/security',
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
