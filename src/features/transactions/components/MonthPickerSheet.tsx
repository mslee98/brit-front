import { useMemo, useRef, useState } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { WheelPicker, WheelPickerColumn, type WheelPickerOption } from '../../../shared/ui/WheelPicker'
import type { YearMonth } from '../types'
import { currentYearMonth } from '../utils/coinFlow'

const YEAR_SPAN = 5

interface MonthPickerSheetProps {
  open: boolean
  year: number
  month: number
  onOpenChange: (open: boolean) => void
  onSelect: (month: YearMonth) => void
}

export function MonthPickerSheet({
  open,
  year,
  month,
  onOpenChange,
  onSelect,
}: MonthPickerSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 3 })
  const [draft, setDraft] = useState<YearMonth>({ year, month })
  const [trackedOpen, setTrackedOpen] = useState(open)
  /** 열 때마다 휠을 새로 마운트해 스크롤 위치를 맞춘다. 닫히는 동안에는 휠을 그대로 둔다 */
  const [openCount, setOpenCount] = useState(0)
  const latest = currentYearMonth()

  useLayoutOverlay(open)

  if (open !== trackedOpen) {
    setTrackedOpen(open)
    if (open) {
      setDraft({ year, month })
      setOpenCount((count) => count + 1)
    }
  }

  const yearOptions = useMemo<WheelPickerOption[]>(() => {
    const first = Math.min(year, latest.year - YEAR_SPAN)
    return Array.from({ length: latest.year - first + 1 }, (_, index) => {
      const value = first + index
      return { value: String(value), label: `${value}년` }
    })
  }, [latest.year, year])

  const lastMonth = draft.year === latest.year ? latest.month : 12
  const monthOptions = useMemo<WheelPickerOption[]>(
    () =>
      Array.from({ length: lastMonth }, (_, index) => ({
        value: String(index + 1),
        label: `${index + 1}월`,
      })),
    [lastMonth],
  )

  const changeYear = (value: string) => {
    const nextYear = Number(value)
    setDraft((current) => ({
      year: nextYear,
      month:
        nextYear === latest.year ? Math.min(current.month, latest.month) : current.month,
    }))
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          aria-label="월 선택"
          layerIndex={layerIndex}
          showHandle
          showCloseButton={false}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <WheelPicker key={openCount}>
              <WheelPickerColumn
                aria-label="연도"
                options={yearOptions}
                value={String(draft.year)}
                onValueChange={changeYear}
              />
              <WheelPickerColumn
                aria-label="월"
                options={monthOptions}
                value={String(draft.month)}
                onValueChange={(value) =>
                  setDraft((current) => ({ ...current, month: Number(value) }))
                }
              />
            </WheelPicker>
          </BottomSheetBody>
          <BottomSheetFooter>
            <ActionButton
              size="large"
              variant="brandSolid"
              style={{ width: '100%' }}
              onClick={() => onSelect(draft)}
            >
              확인
            </ActionButton>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
