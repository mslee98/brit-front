import { createBrowserHistory } from 'history'

import { installBackGuardListener } from './backGuard'

installBackGuardListener()

export const appHistory =
  typeof window === 'undefined'
    ? createBrowserHistory()
    : createBrowserHistory({ window })
