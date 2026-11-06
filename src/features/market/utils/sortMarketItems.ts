import type { MarketSellOrderItemDto, MarketSortId } from '../types'

function amountOf(item: MarketSellOrderItemDto): number {
  return Number(item.remainingCoinAmount)
}

function tradeCountOf(item: MarketSellOrderItemDto): number {
  return item.seller.completedTradeCount ?? 0
}

function createdAtOf(item: MarketSellOrderItemDto): number {
  return new Date(item.createdAt).getTime()
}

/** 거래 이력순: 이전 거래 > 완료 건수 > 완료율 > 최신 */
function recommendScore(item: MarketSellOrderItemDto): number {
  const previous = item.seller.hasTradedBefore ? 1_000_000 : 0
  const trades = tradeCountOf(item) * 100
  const rate = (item.seller.completionRatePct ?? 0) * 10
  return previous + trades + rate
}

export function sortMarketItems(
  items: MarketSellOrderItemDto[],
  sort: MarketSortId,
): MarketSellOrderItemDto[] {
  const next = [...items]
  switch (sort) {
    case 'amountAsc':
      return next.sort((a, b) => amountOf(a) - amountOf(b))
    case 'amountDesc':
      return next.sort((a, b) => amountOf(b) - amountOf(a))
    case 'recent':
      return next.sort((a, b) => createdAtOf(b) - createdAtOf(a))
    case 'recommended':
    default:
      return next.sort((a, b) => {
        const scoreDiff = recommendScore(b) - recommendScore(a)
        if (scoreDiff !== 0) return scoreDiff
        return createdAtOf(b) - createdAtOf(a)
      })
  }
}
