import '@seed-design/css/base.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// NumericKeypad(Tailwind) · PinField 커서 애니메이션 — 메인 앱과 동일 파이프
import '../../index.css'
import '../embed.css'
import { EmbedPayApp } from './EmbedPayApp'
import { takeIntentIdFromHash } from './payResultMessage'

const intentId = takeIntentIdFromHash()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EmbedPayApp intentId={intentId} />
  </StrictMode>,
)
