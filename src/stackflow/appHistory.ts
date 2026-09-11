import { createBrowserHistory } from 'history'

export const appHistory =
  typeof window === 'undefined'
    ? createBrowserHistory()
    : createBrowserHistory({ window })
