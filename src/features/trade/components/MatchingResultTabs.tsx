import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from 'seed-design/ui/tabs'

export type MatchingResultTab = 'exact' | 'near'

interface MatchingResultTabsProps {
  exactCount: number
  nearCount: number
  value: MatchingResultTab
  onValueChange: (value: MatchingResultTab) => void
  exactNotification?: boolean
  nearNotification?: boolean
  children: ReactNode
}

/** Exact / Near Tabs — stickyList로 스크롤 시 상단 고정 */
export function MatchingResultTabs({
  exactCount,
  nearCount,
  value,
  onValueChange,
  exactNotification = false,
  nearNotification = false,
  children,
}: MatchingResultTabsProps) {
  return (
    <TabsRoot
      value={value}
      onValueChange={(next) => {
        if (next === 'exact' || next === 'near') onValueChange(next)
      }}
      triggerLayout="fill"
      size="medium"
      stickyList
      className="matching-result-tabs"
      style={{ width: '100%' }}
    >
      <TabsList>
        <TabsTrigger value="exact" notification={exactNotification && value !== 'exact'}>
          {`정확 매칭 ${exactCount}`}
        </TabsTrigger>
        <TabsTrigger value="near" notification={nearNotification && value !== 'near'}>
          {`가까운 금액 ${nearCount}`}
        </TabsTrigger>
      </TabsList>
      {children}
    </TabsRoot>
  )
}

export function MatchingResultTabPanel({
  value,
  children,
}: {
  value: MatchingResultTab
  children: ReactNode
}) {
  return <TabsContent value={value}>{children}</TabsContent>
}

/**
 * 기본 탭: 첫 결과가 뜨면 한 번만 자동 선택 (exact 우선, 없으면 near).
 * 이후 Exact가 뒤늦게 생겨도 강제 전환하지 않음 — 인라인 배너 CTA만.
 */
export function useMatchingResultTab(params: {
  exactCount: number
  nearCount: number
}): {
  tab: MatchingResultTab
  setTab: (tab: MatchingResultTab) => void
  userPickedRef: MutableRefObject<boolean>
} {
  const userPickedRef = useRef(false)
  const initializedRef = useRef(params.exactCount > 0 || params.nearCount > 0)
  const [tab, setTabState] = useState<MatchingResultTab>(() =>
    params.exactCount > 0 ? 'exact' : 'near',
  )

  useEffect(() => {
    if (userPickedRef.current || initializedRef.current) return
    if (params.exactCount > 0) {
      setTabState('exact')
      initializedRef.current = true
      return
    }
    if (params.nearCount > 0) {
      setTabState('near')
      initializedRef.current = true
    }
  }, [params.exactCount, params.nearCount])

  const setTab = (next: MatchingResultTab) => {
    userPickedRef.current = true
    initializedRef.current = true
    setTabState(next)
  }

  return { tab, setTab, userPickedRef }
}
