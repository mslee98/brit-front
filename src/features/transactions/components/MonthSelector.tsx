import { IconChevronDownLine } from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text } from '@seed-design/react'

interface MonthSelectorProps {
  label: string
  dateSelected: boolean
  onTitleClick: () => void
  onOpenPicker: () => void
}

export function MonthSelector({
  label,
  dateSelected,
  onTitleClick,
  onOpenPicker,
}: MonthSelectorProps) {
  return (
    <HStack align="center" justify="center" gap="x1" py="x2">
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
  )
}
