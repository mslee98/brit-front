/** Chromium VirtualKeyboard API — DOM 타입 보완 */
export interface BrowserVirtualKeyboard extends EventTarget {
  overlaysContent: boolean
  readonly boundingRect: DOMRectReadOnly
}

declare global {
  interface Navigator {
    virtualKeyboard?: BrowserVirtualKeyboard
  }
}

export {}
