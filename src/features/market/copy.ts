export const MARKET_TITLE = '거래소'
export const MARKET_HERO_TITLE = '직접 고르고, 안심하고 거래하세요'
export const MARKET_HERO_SUBTITLE =
  '판매자의 거래 이력을 비교하고, 원하는 금액의 판매글을 찾아보세요.'

export const MARKET_SUMMARY_AVAILABLE = '거래 가능한 판매글'
export const MARKET_SUMMARY_VALUE = (count: number, coinLabel: string) =>
  `${count.toLocaleString('ko-KR')}건 · ${coinLabel}`

export const MARKET_MODE_BUY = 'Coin 구매하기'
export const MARKET_MODE_SELL = 'Coin 판매하기'

/** 정렬 기준이 드러나는 이름 — 이전 거래 상대 > 완료 거래 수 > 완료율 (sortMarketItems) */
export const MARKET_SORT_RECOMMENDED = '거래 이력순'
export const MARKET_SORT_AMOUNT_ASC = '금액 낮은순'
export const MARKET_SORT_AMOUNT_DESC = '금액 높은순'
export const MARKET_SORT_RECENT = '최근 등록순'

export const MARKET_EMPTY = '지금 나와 있는 판매글이 없어요'
export const MARKET_EMPTY_HINT = '나중에 다시 확인하거나, 원하는 금액으로 자동 찾아 보세요.'
export const MARKET_LOAD_ERROR = '거래소 정보를 불러오지 못했어요'

export const MARKET_BADGE_SELLING = '판매 중'
export const MARKET_BADGE_PREVIOUS = '이전에 거래한 상대'
export const MARKET_BADGE_NEW = '신규 판매자'
export const MARKET_SHEET_TITLE = '이 판매자에게 거래를 요청할까요?'
export const MARKET_SHEET_CTA = (coinLabel: string) => `${coinLabel} 거래 요청하기`
export const MARKET_SHEET_CTA_LOADING = '요청 중…'
export const MARKET_SHEET_AMOUNT = '구매할 Coin'
export const MARKET_SHEET_NEW_SELLER_HINT = '아직 거래 이력이 없어요'
/** 서버 정의: 완료 ÷ (완료 + 입금 전 판매자 취소) */
export const MARKET_SHEET_COMPLETION_HINT =
  '완료율은 판매자가 중간에 취소하지 않고 끝낸 거래의 비율이에요.'
export const MARKET_SHEET_PROCESS_TITLE = '요청 후 진행 과정'
export const MARKET_SHEET_PROCESS_STEPS = [
  '판매자가 수락하면 입금 안내가 시작돼요. 수락 전에는 입금하지 마세요.',
  '판매자가 응답하지 않거나 거절하면 요청이 끝나고 거래소로 돌아와요.',
  '수락 전에는 대기 화면에서 요청을 취소할 수 있어요.',
] as const
export const MARKET_APPLY_SUCCESS = '거래 요청을 보냈어요.'

export const MARKET_AUTO_FIND_CTA = '원하는 금액으로 자동 찾기'
