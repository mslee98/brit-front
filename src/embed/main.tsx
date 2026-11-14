import '@seed-design/css/base.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './embed.css'
import { EmbedLinkApp } from './EmbedLinkApp'
import { takeSessionTokenFromHash } from './linkResultMessage'

const sessionToken = takeSessionTokenFromHash()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EmbedLinkApp sessionToken={sessionToken} />
  </StrictMode>,
)
