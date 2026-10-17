import type { TradeRole } from '../types'

export function getDisputeChatBannerTitle(): string {
  return '입금 확인이 맞지 않아 검토 중이에요'
}

export function getDisputeChatBannerDescription(role: TradeRole | null): string {
  if (role === 'BUYER') {
    return '입금 내역(금액·계좌·시각)을 올려 주세요.'
  }
  if (role === 'SELLER') {
    return '계좌에 입금이 안 보이는 화면을 올려 주세요.'
  }
  return '관련 화면을 채팅에 올려 주시면 확인이 빨라져요.'
}

export function getDisputeChatClosedBannerTitle(): string {
  return '검토가 끝났어요'
}

export function getDisputeChatClosedBannerDescription(): string {
  return '이 대화에서는 더 이상 메시지를 보낼 수 없어요.'
}

export function getDisputeChatViewTradeLabel(): string {
  return '거래 보기'
}

export function getDisputeChatContinueLabel(): string {
  return '분쟁 진행 상황 보기'
}

export function getDisputeChatPausedTitle(): string {
  return '분쟁 조정 중이에요'
}

export function getDisputeChatPausedDescription(): string {
  return '이 거래는 잠시 중단됐어요.'
}

export function getDisputeChatPausedCallout(): string {
  return 'Brit 분쟁조정팀에서 내용을 확인하고 있어요. 입금·확인은 잠시 멈춰 있어요.'
}

export function getDisputeChatEmptyText(): string {
  return '입금 확인이 맞는지 대화로 알려 주세요. 상담원이 확인을 시작하면 안내가 떠요.'
}

export function getDisputeChatResultCta(): string {
  return '거래 결과 확인'
}

export function getDisputeChatInfoSheetTitle(): string {
  return '거래 정보'
}
