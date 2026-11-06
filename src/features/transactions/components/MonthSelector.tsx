import {
  IconChevronDownLine,
  IconChevronLeftLine,
  IconChevronRightLine,
} from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text } from '@seed-design/react'

interface MonthSelectorProps {
  label: string
  dateSelected: boolean
  onTitleClick: () => void
  onOpenPicker: () => void
  /** 없으면 화살표를 숨긴다 */
  onPrev?: () => void
  onNext?: () => void
  canGoNext?: boolean
}

export function MonthSelector({
  label,
  dateSelected,
  onTitleClick,
  onOpenPicker,
  onPrev,
  onNext,
  canGoNext = true,
}: MonthSelectorProps) {
  return (
    <HStack align="center" justify="center" gap="x1" py="x2">
      {onPrev ? (
        <button type="button" className="tx-icon-button" aria-label="이전 달" onClick={onPrev}>
          <Icon svg={<IconChevronLeftLine />} size="x5" color="fg.neutral" />
        </button>
      ) : null}
      <HStack align="center" gap="x0_5">
        <button type="button" className="tx-filter-button" onClick={onTitleClick}>
          <Text textStyle="t6Bold" color="fg.neutral">
            {label}
          </Text>
        </button>
        <button
          type="button"
          className="tx-icon-button"
          aria-label={dateSelected ? '월 선택. 날짜 선택은 제목을 누르면 해제돼요' : '월 선택'}
          onClick={onOpenPicker}
        >
          <Icon svg={<IconChevronDownLine />} size="x4" color="fg.neutralSubtle" />
        </button>
      </HStack>
      {onNext ? (
        <button
          type="button"
          className="tx-icon-button"
          aria-label="다음 달"
          disabled={!canGoNext}
          onClick={onNext}
        >
          <Icon
            svg={<IconChevronRightLine />}
            size="x5"
            color={canGoNext ? 'fg.neutral' : 'fg.disabled'}
          />
        </button>
      ) : null}
    </HStack>
  )
}
