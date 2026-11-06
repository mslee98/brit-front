import { useRef } from 'react'
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { HStack, Icon, Portal, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'
import { Checkbox, CheckboxGroup } from 'seed-design/ui/checkbox'
import { RadioGroup, RadioGroupItem } from 'seed-design/ui/radio-group'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { STATUS_FILTERS, TRANSACTION_TYPE_FILTERS } from '../constants'
import type { StatusFilterId, TransactionTypeFilter, YearMonth } from '../types'
import { formatMonthLabel } from '../utils/coinFlow'

interface TransactionFilterSheetProps {
  open: boolean
  type: TransactionTypeFilter
  statuses: StatusFilterId[]
  month: YearMonth
  onOpenChange: (open: boolean) => void
  onTypeChange: (type: TransactionTypeFilter) => void
  onStatusChange: (id: StatusFilterId, checked: boolean) => void
  onOpenMonthPicker: () => void
  onReset: () => void
  onApply: () => void
}


export function TransactionFilterSheet({
  open,
  type,
  statuses,
  month,
  onOpenChange,
  onTypeChange,
  onStatusChange,
  onOpenMonthPicker,
  onReset,
  onApply,
}: TransactionFilterSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })

  useLayoutOverlay(open)

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="필터"
          layerIndex={layerIndex}
          showHandle
          showCloseButton
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x5" pb="x2">
              <RadioGroup
                label="거래 유형"
                value={type}
                onValueChange={(value) => onTypeChange(value as TransactionTypeFilter)}
              >
                {TRANSACTION_TYPE_FILTERS.map((option) => (
                  <RadioGroupItem key={option.id} value={option.id} label={option.label} />
                ))}
              </RadioGroup>

              <CheckboxGroup label="상태">
                {STATUS_FILTERS.map((item) => (
                  <Checkbox
                    key={item.id}
                    label={item.label}
                    checked={statuses.includes(item.id)}
                    onCheckedChange={(checked) => onStatusChange(item.id, checked === true)}
                  />
                ))}
              </CheckboxGroup>

              <VStack gap="x1">
                <Text textStyle="t4Bold" color="fg.neutral">
                  기간
                </Text>
                <button type="button" className="tx-period-row" onClick={onOpenMonthPicker}>
                  <Text textStyle="t5Regular" color="fg.neutral">
                    {formatMonthLabel(month)}
                  </Text>
                  <HStack align="center" gap="x1">
                    <Text textStyle="t4Regular" color="fg.neutralSubtle">
                      변경
                    </Text>
                    <Icon svg={<IconChevronRightLine />} size="x4" color="fg.neutralSubtle" />
                  </HStack>
                </button>
              </VStack>
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <HStack gap="x2" width="full">
              <ActionButton size="large" variant="neutralWeak" style={{ flex: 1 }} onClick={onReset}>
                초기화
              </ActionButton>
              <ActionButton size="large" variant="brandSolid" style={{ flex: 1 }} onClick={onApply}>
                적용하기
              </ActionButton>
            </HStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
