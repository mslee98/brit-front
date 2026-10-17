import { useRef, useState } from 'react'
import { IconChevronLeftLine, IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { HStack, Icon, Portal, Text, VStack } from '@seed-design/react'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import type { YearMonth } from '../types'

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
  const [viewYear, setViewYear] = useState(year)
  const [trackedOpen, setTrackedOpen] = useState(open)

  useLayoutOverlay(open)

  if (open !== trackedOpen) {
    setTrackedOpen(open)
    if (open) setViewYear(year)
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="월 선택"
          layerIndex={layerIndex}
          showHandle
          showCloseButton
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x4" pb="x4">
              <HStack align="center" justify="space-between">
                <button
                  type="button"
                  className="tx-icon-button"
                  aria-label="이전 해"
                  onClick={() => setViewYear((current) => current - 1)}
                >
                  <Icon svg={<IconChevronLeftLine />} size="x5" color="fg.neutral" />
                </button>
                <Text textStyle="t6Bold" color="fg.neutral">
                  {viewYear}년
                </Text>
                <button
                  type="button"
                  className="tx-icon-button"
                  aria-label="다음 해"
                  onClick={() => setViewYear((current) => current + 1)}
                >
                  <Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutral" />
                </button>
              </HStack>
              <div className="tx-month-grid">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((itemMonth) => {
                  const selected = viewYear === year && itemMonth === month
                  return (
                    <button
                      key={itemMonth}
                      type="button"
                      className={selected ? 'tx-month-cell tx-month-cell--selected' : 'tx-month-cell'}
                      aria-pressed={selected}
                      onClick={() => onSelect({ year: viewYear, month: itemMonth })}
                    >
                      {itemMonth}월
                    </button>
                  )
                })}
              </div>
            </VStack>
          </BottomSheetBody>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
