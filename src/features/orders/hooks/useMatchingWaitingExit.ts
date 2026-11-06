import { useState } from 'react'

import { useBackGuard } from '../../../stackflow/backGuard'
import { goBack } from '../../../stackflow/navigation'
import type { MatchingWaitingPhase } from './useMatchingWaitingScreen'

/**
 * 매칭 대기 화면 이탈 규칙 — X·하드웨어 뒤로가 같은 의도로 동작한다.
 * - searching: 이탈 확인 다이얼로그 (매칭은 백그라운드 유지)
 * - requestPending: 요청 취소 시트
 * - 그 외: 바로 아래 화면으로
 */
export function useMatchingWaitingExit(phase: MatchingWaitingPhase) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false)
  const [prevPhase, setPrevPhase] = useState(phase)
  if (phase !== prevPhase) {
    setPrevPhase(phase)
    if (phase !== 'requestPending') setCancelSheetOpen(false)
  }

  const isSearching = phase === 'searching'
  const isRequestPending = phase === 'requestPending'
  const isRequestCancelled = phase === 'requestCancelled'
  const isActiveFlow = isSearching || isRequestPending
  const showsCloseAction = isActiveFlow || isRequestCancelled

  const handleExitIntent = () => {
    if (isSearching) {
      setLeaveDialogOpen(true)
      return
    }
    if (isRequestPending) {
      setCancelSheetOpen(true)
      return
    }
    goBack()
  }

  useBackGuard(isActiveFlow, handleExitIntent)

  return {
    showsCloseAction,
    preventSwipeBack: showsCloseAction,
    handleExitIntent,
    handleConfirmLeave: goBack,
    leaveDialogOpen,
    setLeaveDialogOpen,
    stopDialogOpen,
    setStopDialogOpen,
    cancelSheetOpen,
    setCancelSheetOpen,
  }
}
