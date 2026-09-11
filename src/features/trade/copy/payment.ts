import type { PaymentCountdownTone } from '../hooks/usePaymentCountdown'

export function getPaymentHeroTitle(amountLabel: string): string {
  const withWon = amountLabel.endsWith('원') ? amountLabel : `${amountLabel}원`
  return `${withWon}을 입금해 주세요`
}

export function getPaymentPendingTitle(amountLabel: string): string {
  return getPaymentHeroTitle(amountLabel)
}

export function getPaymentPendingToSeller(nickname: string): string {
  const name = nickname.endsWith('님') ? nickname : `${nickname}님`
  return `${name}에게 정확한 금액을 보내주세요.`
}

export function getPaymentPendingCtaLabel(): string {
  return '입금했어요'
}

export function getPaymentFeeNoneLabel(): string {
  return '없음'
}

export function getPaymentFooterReportHint(coinLabel: string): string {
  return `송금을 완료한 뒤 아래 버튼을 눌러주세요. 입금 확인 후 ${coinLabel}을 받아요.`
}

export function getPaymentBuyerPendingCancelLabel(): string {
  return '거래 취소'
}

export function getPaymentReportedBuyerTitle(): string {
  return '입금 확인을 요청했어요'
}

export function getPaymentReportedBuyerStatusLine(): string {
  return '판매자 확인 대기'
}

export function getPaymentReportedBuyerReassuranceLines(): readonly [string, string] {
  return ['앱을 닫아도 거래는 계속 진행돼요.', '확인 결과는 알림으로 알려드릴게요.']
}

export function getPaymentReportedBuyerDelayHint(): string {
  return '확인이 늦어지면 거래 내역에서 문의할 수 있어요.'
}

/** 구매자 PAYMENT_REPORTED — 판매자 확인 대기 풀페이지 */
export function getPaymentBuyerWaitingDescriptionLines(): readonly [string, string] {
  return ['판매자가 입금을 확인하고 있어요.', '확인되면 Coin이 자동으로 지급돼요.']
}

export function getPaymentBuyerWaitingTimerCaption(): string {
  return '확인 시간이 지나면\n추가 확인을 요청할 수 있어요.'
}

export function getPaymentBuyerWaitingInfoCta(): string {
  return '거래 정보 보기 >'
}

export function getPaymentBuyerWaitingInfoSheetTitle(): string {
  return '거래 정보'
}

export function getPaymentBuyerWaitingContactLabel(): string {
  return '거래 내역에서 문의'
}

export function getPaymentBuyerWaitingDisputeLabel(): string {
  return '입금 문제 신고'
}

export type BuyerPaymentReportedStepCopy = {
  status: 'completed' | 'current' | 'pending'
  stepNumber: number
  title: string
  description: string
  meta?: string
}

/** 구매자 입금 확인 대기 세로 Stepper 4단계 */
export function buildBuyerPaymentReportedSteps(
  amountLabel: string,
  remainingMeta: string | null,
): BuyerPaymentReportedStepCopy[] {
  const withWon = amountLabel.endsWith('원') ? amountLabel : `${amountLabel}원`

  return [
    {
      status: 'completed',
      stepNumber: 1,
      title: '매칭 완료',
      description: '판매자와 거래가 연결됐어요.',
    },
    {
      status: 'completed',
      stepNumber: 2,
      title: '입금 완료',
      description: `${withWon} 입금을 알렸어요.`,
    },
    {
      status: 'current',
      stepNumber: 3,
      title: '판매자 확인 중',
      description: '판매자가 입금 내역을 확인하고 있어요.\n지금은 기다려주세요.',
      meta: remainingMeta ?? undefined,
    },
    {
      status: 'pending',
      stepNumber: 4,
      title: '거래 완료',
      description: '확인되면 Coin이 자동으로 지급돼요.',
    },
  ]
}

/** 판매자 PAYMENT_PENDING — 입금 대기 상태 화면 */
export function getPaymentSellerWaitingTitle(): string {
  return '구매자가 입금하고 있어요'
}

export function getPaymentSellerWaitingDescriptionLines(nickname?: string): readonly [string, string] {
  if (nickname) {
    const name = nickname.endsWith('님') ? nickname : `${nickname}님`
    return [`${name}이 입금을 진행하고 있어요.`, '완료되면 바로 알려드릴게요.']
  }
  return ['지금은 기다려주세요.', '입금이 완료되면 바로 알려드릴게요.']
}

export function getPaymentSellerWaitingTimerCaption(): string {
  return '입금 시간이 지나면\n거래가 자동으로 취소될 수 있어요.'
}

export function getPaymentSellerWaitingInfoCta(): string {
  return '거래 정보 보기 >'
}

export function getPaymentSellerWaitingInfoSheetTitle(): string {
  return '거래 정보'
}

export function getPaymentSellerWaitingCancelLabel(): string {
  return '거래 취소'
}

export function getPaymentSellerWaitingHomeDetail(nickname: string): string {
  const name = nickname.endsWith('님') ? nickname : `${nickname}님`
  return `${name}의 입금을 기다리고 있어요`
}

export function getPaymentSellerWaitingReassuranceLines(): readonly [string, string] {
  return [
    '입금이 완료되면 알림으로 알려드릴게요.',
    '다른 화면으로 이동해도 괜찮아요.',
  ]
}

/** 판매자 PAYMENT_REPORTED — 입금 확인 풀페이지 */
export function getPaymentSellerConfirmTitle(): string {
  return '구매자가 입금했다고 알려왔어요'
}

export function getPaymentSellerConfirmDescriptionLines(): readonly [string] {
  return ['계좌 입금 내역을 확인해 주세요.']
}

export function getPaymentSellerConfirmStatusDetail(): string {
  return '입금 확인 필요'
}

export function getPaymentSellerConfirmDenyLabel(): string {
  return '못 받았어요'
}

export function getPaymentSellerConfirmAcceptLabel(): string {
  return '돈 받았어요'
}

export type SellerPaymentPendingStepCopy = {
  status: 'completed' | 'current' | 'pending'
  stepNumber: number
  title: string
  description: string
  meta?: string
}

/** 판매자 입금 대기 세로 Stepper 4단계 */
export function buildSellerPaymentPendingSteps(
  amountLabel: string,
  remainingMeta: string | null,
): SellerPaymentPendingStepCopy[] {
  const withWon = amountLabel.endsWith('원') ? amountLabel : `${amountLabel}원`

  return [
    {
      status: 'completed',
      stepNumber: 1,
      title: '매칭 완료',
      description: '구매자와 거래가 연결됐어요.',
    },
    {
      status: 'current',
      stepNumber: 2,
      title: '구매자 입금 중',
      description: `구매자가 ${withWon}을 입금하고 있어요.\n지금은 기다려주세요.`,
      meta: remainingMeta ?? undefined,
    },
    {
      status: 'pending',
      stepNumber: 3,
      title: '입금 확인',
      description: "구매자가 '입금했어요'를 누르면\n입금 내역을 확인해 주세요.",
    },
    {
      status: 'pending',
      stepNumber: 4,
      title: '거래 완료',
      description: '입금 확인 후 Coin이 전달돼요.',
    },
  ]
}

/** 판매자 입금 확인(PAYMENT_REPORTED) 세로 Stepper 4단계 */
export function buildSellerPaymentReportedSteps(
  amountLabel: string,
  remainingMeta: string | null,
): SellerPaymentPendingStepCopy[] {
  const withWon = amountLabel.endsWith('원') ? amountLabel : `${amountLabel}원`

  return [
    {
      status: 'completed',
      stepNumber: 1,
      title: '매칭 완료',
      description: '구매자와 거래가 연결됐어요.',
    },
    {
      status: 'completed',
      stepNumber: 2,
      title: '입금 완료',
      description: `구매자가 ${withWon} 입금을 알렸어요.`,
    },
    {
      status: 'current',
      stepNumber: 3,
      title: '입금 확인',
      description: '계좌 입금 내역을 확인해 주세요.',
      meta: remainingMeta ?? undefined,
    },
    {
      status: 'pending',
      stepNumber: 4,
      title: '거래 완료',
      description: '입금 확인 후 Coin이 전달돼요.',
    },
  ]
}

/** 취소 전 입금 여부 재확인 */
export const PAYMENT_CANCEL_CONFIRM_TITLE = '아직 입금하지 않았나요?'
export const PAYMENT_CANCEL_CONFIRM_LINE1 =
  '이미 입금했다면 거래를 취소하지 마세요.'
export const PAYMENT_CANCEL_CONFIRM_LINE2 = '먼저 입금 완료를 알려주세요.'
export const PAYMENT_CANCEL_CONFIRM_REPORT = '입금했어요'
export const PAYMENT_CANCEL_CONFIRM_CANCEL = '아직 입금하지 않았어요 · 거래 취소하기'

export const PAYMENT_SENT_CONFIRM_TITLE = '입금을 완료했나요?'
export const PAYMENT_SENT_CONFIRM_DESCRIPTION =
  '아래 내용으로 실제 송금을 완료한 경우에만 판매자에게 입금 확인을 요청해 주세요.'
export const PAYMENT_SENT_CONFIRM_WARNING =
  '입금하지 않은 경우, 거래가 취소되거나 이용이 제한될 수 있어요.'
export const PAYMENT_SENT_CONFIRM_SUBMIT = '입금 완료했어요'
export const PAYMENT_SENT_CONFIRM_BACK = '돌아가기'

export function getPaymentCountdownCopy(
  tone: PaymentCountdownTone,
  remainingLabel: string,
  deadlineLabel: string,
): { title: string; description: string } {
  if (tone === 'critical') {
    return {
      title: '입금 시간이 지났어요',
      description: '이미 입금했다면 고객센터에 문의해 주세요.',
    }
  }

  if (tone === 'warning') {
    return {
      title: `${remainingLabel} 남았어요`,
      description: '기한 내 입금하지 않으면 거래가 취소될 수 있어요.',
    }
  }

  return {
    title: `남은 시간 ${remainingLabel}`,
    description: deadlineLabel ? `${deadlineLabel}해야 거래가 유지돼요.` : '',
  }
}

/** `04:25 남음 · 오후 3:51까지` */
export function getPaymentCountdownSummaryLine(
  remainingClockLabel: string,
  deadlineTimeLabel: string,
): string {
  if (!deadlineTimeLabel) return `${remainingClockLabel} 남음`
  return `${remainingClockLabel} 남음 · ${deadlineTimeLabel}`
}
