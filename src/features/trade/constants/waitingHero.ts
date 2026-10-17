/** Waiting / Confirm 풀페이지 Hero 사이즈 토큰 (값 유지) */
export const WAITING_APNG_HERO_SIZE = 140
export const WAITING_LOTTIE_HERO_SIZE = 280

/**
 * 입금 확인 Lottie 원본은 830×600.
 * 정사각형으로 키우면 좌우로 넘치고, 아래 카피·버튼까지 한 화면을 벗어난다.
 * 높이는 최대 190px, 짧은 화면에서는 뷰포트의 20%를 넘지 않게 맞춘다.
 */
export const CONFIRM_LOTTIE_FRAME_STYLE = {
  width: 'min(100%, calc(min(190px, 20dvh) * 830 / 600))',
  maxWidth: '100%',
  aspectRatio: '830 / 600',
  overflow: 'hidden',
} as const
