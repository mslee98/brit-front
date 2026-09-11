import '@seed-design/css/base.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionProvider } from './app/providers/MotionProvider'
import { handleTradeCompletedWallet } from './features/home/api/homeWalletSync'
import { initPwaInstallPromptListener } from './features/pwa/services/pwaInstallPromptStore'
import { setMatchingCandidateFactory } from './features/trade/matching/matchingSession.store'
import { setOnTradeCompleted, setTradeSessionDevHooks } from './features/trade/stores/tradeSession.store'
import './app/styles/typography.css'
import './app/styles/amount-hero-field.css'
import './app/styles/trade-compose.css'
import './app/styles/layout.css'
import './app/styles/toss-theme.css'
import './app/styles/home-header.css'
import './app/styles/home-balance-card.css'
import './app/styles/home-matching-dock.css'
import './app/styles/home-matching-feed.css'
import './app/styles/bottom-sheet-scroll.css'
import './app/styles/global-active-trade-banner.css'
import './app/styles/split-progress-bar.css'
import './app/styles/home-install-banner.css'
import './app/styles/tap-scale.css'
import './index.css'
import { LEGACY_PATH_REDIRECTS, normalizePathname } from './shared/constants/app-layout'
import { appHistory } from './stackflow/appHistory'
import App from './App.tsx'

const legacyRedirect = LEGACY_PATH_REDIRECTS[normalizePathname(window.location.pathname)]
if (legacyRedirect) {
  appHistory.replace(legacyRedirect)
}

initPwaInstallPromptListener()

// trade → home wallet: API refresh 또는 mock optimistic
setOnTradeCompleted((input) => {
  void handleTradeCompletedWallet(input)
})

async function initDevTradeMocks() {
  if (!import.meta.env.DEV) return

  const [
    { createMockCandidates },
    devPay,
    { initTradeMockScenario },
    { shouldUseTradesHttpApi },
  ] = await Promise.all([
    import('./features/trade/mocks/matchingSession.mock'),
    import('./features/trade/mocks/devPaymentSimulation.mock'),
    import('./features/trade/mocks/tradeScenario.mock'),
    import('./features/trade/api/trades.api'),
  ])

  setMatchingCandidateFactory(createMockCandidates)
  setTradeSessionDevHooks({
    onPaymentReported: (tradeId, version, confirmPayment) => {
      devPay.onPaymentReportedDevMock(tradeId, version, confirmPayment)
    },
    clearSimulation: (tradeId) => {
      devPay.clearDevPaymentSimulation(tradeId)
    },
  })

  if (!shouldUseTradesHttpApi()) {
    initTradeMockScenario()
  }
}

void initDevTradeMocks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
)
