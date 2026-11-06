import { seedPlugin } from '@seed-design/stackflow'
import { historySyncPlugin } from '@stackflow/plugin-history-sync'
import { basicRendererPlugin } from '@stackflow/plugin-renderer-basic'
import { stackflow } from '@stackflow/react'

import AccountRecoveryActivity from '../activities/auth/AccountRecoveryActivity'
import AccountSettingsActivity from '../activities/auth/AccountSettingsActivity'
import ChangeBankAccountActivity from '../activities/auth/ChangeBankAccountActivity'
import ChangePasswordActivity from '../activities/auth/ChangePasswordActivity'
import FindLoginIdActivity from '../activities/auth/FindLoginIdActivity'
import LoginActivity from '../activities/auth/LoginActivity'
import TransactionPinActivity from '../activities/auth/TransactionPinActivity'
import SecuritySettingsActivity from '../activities/auth/SecuritySettingsActivity'
import NotificationSettingsActivity from '../activities/auth/NotificationSettingsActivity'
import NotificationCenterActivity from '../activities/NotificationCenterActivity'
import SignupAccountActivity from '../activities/auth/SignupAccountActivity'
import SignupCredentialsActivity from '../activities/auth/SignupCredentialsActivity'
import SignupCompleteActivity from '../activities/auth/SignupCompleteActivity'
import SignupIdentityActivity from '../activities/auth/SignupIdentityActivity'
import SignupPinActivity from '../activities/auth/SignupPinActivity'
import SignupTermsActivity from '../activities/auth/SignupTermsActivity'
import RegistrationStatusActivity from '../activities/auth/RegistrationStatusActivity'
import CommunityActivity from '../activities/CommunityActivity'
import HomeActivity from '../activities/HomeActivity'
import MyActivity from '../activities/MyActivity'
import StoreActivity from '../activities/StoreActivity'
import TransactionsActivity from '../activities/TransactionsActivity'
import TransactionAnalysisActivity from '../activities/TransactionAnalysisActivity'
import TransactionDetailActivity from '../activities/TransactionDetailActivity'
import NotFoundActivity from '../activities/NotFoundActivity'
import SmsSchemePocActivity from '../activities/poc/SmsSchemePocActivity'
import TradeActivity from '../activities/TradeActivity'
import DisputeChatActivity from '../activities/DisputeChatActivity'
import TradeComposeActivity from '../activities/TradeComposeActivity'
import MarketActivity from '../activities/MarketActivity'
import MatchingWaitingActivity from '../activities/MatchingWaitingActivity'
import SellOrderDetailActivity from '../activities/SellOrderDetailActivity'
import { detectTheme } from '../shared/utils/detectTheme'
import { appHistory } from './appHistory'
import { config } from './config'
import { bottomNavChromePlugin } from './plugins/bottomNavChromePlugin'
import { stackSnapshotPlugin } from './plugins/stackSnapshotPlugin'

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
    My: MyActivity,
    Transactions: TransactionsActivity,
    TransactionAnalysis: TransactionAnalysisActivity,
    TransactionDetail: TransactionDetailActivity,
    Store: StoreActivity,
    Community: CommunityActivity,
    Trade: TradeActivity,
    DisputeChat: DisputeChatActivity,
    TradeCompose: TradeComposeActivity,
    Market: MarketActivity,
    MatchingWaiting: MatchingWaitingActivity,
    SellOrderDetail: SellOrderDetailActivity,
    SignupTerms: SignupTermsActivity,
    SignupIdentity: SignupIdentityActivity,
    SignupAccount: SignupAccountActivity,
    SignupCredentials: SignupCredentialsActivity,
    SignupPin: SignupPinActivity,
    SignupComplete: SignupCompleteActivity,
    RegistrationStatus: RegistrationStatusActivity,
    Login: LoginActivity,
    AccountSettings: AccountSettingsActivity,
    ChangePassword: ChangePasswordActivity,
    ChangeBankAccount: ChangeBankAccountActivity,
    TransactionPin: TransactionPinActivity,
    FindLoginId: FindLoginIdActivity,
    SecuritySettings: SecuritySettingsActivity,
    NotificationSettings: NotificationSettingsActivity,
    NotificationCenter: NotificationCenterActivity,
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
      history: appHistory,
      fallbackActivity: () => 'NotFound',
    }),
    bottomNavChromePlugin(),
    stackSnapshotPlugin(),
  ],
})
