import {
  IconChevronDownLine,
  IconChevronLeftLine,
  IconChevronRightLine,
} from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text } from '@seed-design/react'

interface MonthSelectorProps {
  label: string
  /** 제목을 누르면 월 선택 시트를 연다 */
  onTitleClick: () => void
  /** 화살표가 없는 화면에서 월 선택을 알려 주는 ▼ 표시 */
  showPickerIcon?: boolean
  /** 없으면 화살표를 숨긴다 */
  onPrev?: () => void
  onNext?: () => void
  canGoNext?: boolean
}

export function MonthSelector({
  label,
  onTitleClick,
  showPickerIcon = false,
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
      <button
        type="button"
        className="tx-filter-button"
        aria-label={`${label}, 월 선택`}
        onClick={onTitleClick}
      >
        <HStack align="center" gap="x1">
          <Text textStyle="t6Bold" color="fg.neutral">
            {label}
          </Text>
          {showPickerIcon ? (
            <Icon svg={<IconChevronDownLine />} size="x4" color="fg.neutralSubtle" />
          ) : null}
        </HStack>
      </button>
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
