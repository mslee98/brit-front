import { useState, type CSSProperties, type UIEvent } from 'react'

const SCROLL_FOG_MIN_ITEMS = 3
/** 정렬 칩 바로 아래라 짧게, 스크롤했을 때만 */
const MARKET_SCROLL_FOG_TOP_PX = 28
const MARKET_SCROLL_FOG_BOTTOM_PX = 72

const SIZES = { top: MARKET_SCROLL_FOG_TOP_PX, bottom: MARKET_SCROLL_FOG_BOTTOM_PX }

/** 리스트 마지막 항목이 하단 fog에 덮이지 않도록 market-screen.css 패딩이 이 값을 따른다 */
const LIST_INNER_STYLE = {
  '--market-list-fog-bottom': `${MARKET_SCROLL_FOG_BOTTOM_PX}px`,
} as CSSProperties

/** 거래소 리스트 ScrollFog — 하단 상시, 상단은 스크롤 후에만 */
export function useMarketListScrollFog(itemCount: number, enabled: boolean) {
  const [isListAtTop, setIsListAtTop] = useState(true)
  const visible = enabled && itemCount >= SCROLL_FOG_MIN_ITEMS

  const placement: Array<'top' | 'bottom'> = visible
    ? isListAtTop
      ? ['bottom']
      : ['top', 'bottom']
    : []

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    setIsListAtTop(event.currentTarget.scrollTop <= 0)
  }

  return { placement, sizes: SIZES, onScroll, listInnerStyle: LIST_INNER_STYLE }
}
