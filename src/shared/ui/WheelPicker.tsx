import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import './wheel-picker.css'

const SETTLE_DELAY_MS = 120

export interface WheelPickerOption {
  value: string
  label: string
}

interface WheelPickerProps {
  /** 한 칸 높이(px) */
  itemSize?: number
  /** 보이는 칸 수. 가운데 칸이 선택값이 되도록 홀수로 둔다 */
  visibleItemCount?: number
  children: ReactNode
}

/** 여러 열을 나란히 두고 가운데 줄을 강조한다 */
export function WheelPicker({ itemSize = 48, visibleItemCount = 5, children }: WheelPickerProps) {
  const style = {
    '--wheel-item-size': `${itemSize}px`,
    '--wheel-visible-count': visibleItemCount,
  } as CSSProperties

  return (
    // data-no-drag: BottomSheet 안에서 휠을 굴려도 시트가 끌려 내려가지 않게 한다
    <div className="wheel-picker" style={style} data-no-drag>
      <div className="wheel-picker__highlight" aria-hidden />
      {children}
    </div>
  )
}

interface WheelPickerColumnProps {
  options: readonly WheelPickerOption[]
  value: string
  onValueChange: (value: string) => void
  'aria-label': string
}

export function WheelPickerColumn({
  options,
  value,
  onValueChange,
  'aria-label': ariaLabel,
}: WheelPickerColumnProps) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const settleTimerRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const idPrefix = useId()
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [centerIndex, setCenterIndex] = useState(selectedIndex)

  const itemSize = useCallback(() => {
    const el = listRef.current
    if (!el) return 0
    return parseFloat(getComputedStyle(el).getPropertyValue('--wheel-item-size')) || 0
  }, [])

  useLayoutEffect(() => {
    const el = listRef.current
    const size = itemSize()
    if (!el || size === 0) return
    const top = selectedIndex * size
    const behavior = mountedRef.current ? 'smooth' : 'auto'
    mountedRef.current = true
    if (Math.abs(el.scrollTop - top) < 1) return
    el.scrollTo({ top, behavior })
  }, [itemSize, options, selectedIndex])

  useEffect(
    () => () => {
      if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current)
    },
    [],
  )

  const indexAtScroll = useCallback(() => {
    const el = listRef.current
    const size = itemSize()
    if (!el || size === 0) return selectedIndex
    return Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / size)))
  }, [itemSize, options.length, selectedIndex])

  const handleScroll = useCallback(() => {
    mountedRef.current = true
    setCenterIndex(indexAtScroll())
    if (settleTimerRef.current != null) window.clearTimeout(settleTimerRef.current)
    settleTimerRef.current = window.setTimeout(() => {
      settleTimerRef.current = null
      const next = options[indexAtScroll()]
      if (next && next.value !== value) onValueChange(next.value)
    }, SETTLE_DELAY_MS)
  }, [indexAtScroll, onValueChange, options, value])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
      if (step === 0) return
      event.preventDefault()
      const next = options[selectedIndex + step]
      if (next) onValueChange(next.value)
    },
    [onValueChange, options, selectedIndex],
  )

  const scrollToIndex = useCallback(
    (index: number) => {
      listRef.current?.scrollTo({ top: index * itemSize(), behavior: 'smooth' })
    },
    [itemSize],
  )

  return (
    <div
      ref={listRef}
      className="wheel-picker__column"
      role="listbox"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-activedescendant={`${idPrefix}-${value}`}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => (
        <div
          key={option.value}
          id={`${idPrefix}-${option.value}`}
          role="option"
          aria-selected={option.value === value}
          className={
            index === centerIndex
              ? 'wheel-picker__item wheel-picker__item--center'
              : 'wheel-picker__item'
          }
          onClick={() => scrollToIndex(index)}
        >
          {option.label}
        </div>
      ))}
    </div>
  )
}
