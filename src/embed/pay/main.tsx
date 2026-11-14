import '@seed-design/css/base.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '../embed.css'
import { EmbedPayApp } from './EmbedPayApp'
import { takeIntentIdFromHash } from './payResultMessage'

const intentId = takeIntentIdFromHash()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EmbedPayApp intentId={intentId} />
  </StrictMode>,
)
