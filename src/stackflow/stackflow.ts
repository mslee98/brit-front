import { seedPlugin } from '@seed-design/stackflow'
import { historySyncPlugin } from '@stackflow/plugin-history-sync'
import { basicRendererPlugin } from '@stackflow/plugin-renderer-basic'
import { stackflow } from '@stackflow/react'

import AccountRecoveryActivity from '../activities/auth/AccountRecoveryActivity'
import LoginActivity from '../activities/auth/LoginActivity'
import SecuritySettingsActivity from '../activities/auth/SecuritySettingsActivity'
import SignupAccountActivity from '../activities/auth/SignupAccountActivity'
import SignupCredentialsActivity from '../activities/auth/SignupCredentialsActivity'
import SignupCompleteActivity from '../activities/auth/SignupCompleteActivity'
import SignupIdentityActivity from '../activities/auth/SignupIdentityActivity'
import SignupPinActivity from '../activities/auth/SignupPinActivity'
import SignupSmsActivity from '../activities/auth/SignupSmsActivity'
import SignupTermsActivity from '../activities/auth/SignupTermsActivity'
import DetailActivity from '../activities/DetailActivity'
import HomeActivity from '../activities/HomeActivity'
import NotFoundActivity from '../activities/NotFoundActivity'
import SmsSchemePocActivity from '../activities/poc/SmsSchemePocActivity'
import TradeActivity from '../activities/TradeActivity'
import TradeComposeActivity from '../activities/TradeComposeActivity'
import { detectTheme } from '../shared/utils/detectTheme'
import { config } from './config'

/**
 * Stackflow bootstrap.
 *
 * - Activity 내부 네비: `useFlow()` (push / pop / replace)
 * - Stack 밖 크롬: `actions` (GlobalBottomNavigation, SignupComplete 등)
 *
 * @see docs/stackflow/README.md
 */
export const { Stack, actions } = stackflow({
  config,
  components: {
    Home: HomeActivity,
    Detail: DetailActivity,
    Trade: TradeActivity,
    TradeCompose: TradeComposeActivity,
    SignupTerms: SignupTermsActivity,
    SignupIdentity: SignupIdentityActivity,
    SignupSms: SignupSmsActivity,
    SignupAccount: SignupAccountActivity,
    SignupCredentials: SignupCredentialsActivity,
    SignupPin: SignupPinActivity,
    SignupComplete: SignupCompleteActivity,
    Login: LoginActivity,
    SecuritySettings: SecuritySettingsActivity,
    AccountRecovery: AccountRecoveryActivity,
    SmsSchemePoc: SmsSchemePocActivity,
    NotFound: NotFoundActivity,
  },
  plugins: [
    basicRendererPlugin(),
    seedPlugin(({ initialContext }) => ({
      theme: initialContext?.theme ?? detectTheme(),
    })),
    historySyncPlugin({
      config,
      fallbackActivity: () => 'NotFound',
    }),
  ],
})
