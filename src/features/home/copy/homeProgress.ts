/** 홈 hydrate Buy/Sell 진행 카드 카피 */
export const HOME_PROGRESS_COPY = {
  sellPendingAttention: {
    title: '구매 요청이 도착했어요',
    detail: '요청을 확인하고 수락할 수 있어요',
  },
  sellWaiting: {
    title: '판매 · 구매자 대기',
    detail: '구매 요청을 기다리고 있어요.',
  },
  buyRequestPending: {
    title: '판매자 수락 대기',
    detail: '판매자가 요청을 확인 중이에요',
  },
  buyMatching: {
    title: '구매 · 매칭 중',
    detail: '판매자를 찾고 있어요',
  },
  paymentTimeoutAttention: {
    title: '미입금 확정이 필요해요',
    detail: '입금 기한이 지났어요. 미입금으로 확정해 주세요.',
  },
  disputeAttention: {
    title: '분쟁 진행 중',
    detail: '운영에서 확인 중이에요. 결과는 알림으로 알려드릴게요.',
  },
} as const
