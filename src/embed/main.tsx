import '@seed-design/css/base.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 메인 앱과 동일: Tailwind utilities · pin-field-cursor (연결 팝업 공용)
import '../index.css'
import './embed.css'
import { EmbedLinkApp } from './EmbedLinkApp'
import { takeSessionTokenFromHash } from './linkResultMessage'

const sessionToken = takeSessionTokenFromHash()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EmbedLinkApp sessionToken={sessionToken} />
  </StrictMode>,
)
