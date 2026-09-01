import { useLayoutEffect, useRef } from 'react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import {
  caretIndexFromDigitCount,
  countDigitsInAmountInput,
} from '../utils/formatAmount'

interface AmountHeroFieldProps {
  value: string
  onValueChange: (value: string) => void
  label?: string
  /** @default true */
  labelVisuallyHidden?: boolean
  placeholder?: string
  description?: string
  errorMessage?: string
  invalid?: boolean
  /** @default 원 */
  suffix?: string
  /** SEED TextField size — @default large */
  size?: 'medium' | 'large'
  /** SEED TextField variant — @default underline (단일 금액 입력 권장) */
  fieldVariant?: 'outline' | 'underline'
  className?: string
}

/**
 * 금액 입력 필드 (콤마 포맷 + 커서 복원).
 * SEED TextField outline/underline을 그대로 사용합니다.
 */
export function AmountHeroField({
  value,
  onValueChange,
  label = '금액',
  labelVisuallyHidden = true,
  placeholder = '금액을 입력하세요',
  description,
  errorMessage,
  invalid = false,
  suffix = '원',
  size = 'large',
  fieldVariant = 'underline',
  className,
}: AmountHeroFieldProps) {
  const rootClassName = ['tabular-nums', className].filter(Boolean).join(' ')
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingDigitIndexRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const digitIndex = pendingDigitIndexRef.current
    const input = inputRef.current
    if (digitIndex === null || !input) return

    pendingDigitIndexRef.current = null
    const caret = caretIndexFromDigitCount(value, digitIndex)
    input.setSelectionRange(caret, caret)
  }, [value])

  const handleValueChange = (nextValue: string) => {
    const input = inputRef.current
    const selectionStart = input?.selectionStart ?? nextValue.length
    pendingDigitIndexRef.current = countDigitsInAmountInput(nextValue, selectionStart)
    onValueChange(nextValue)

    queueMicrotask(() => {
      const digitIndex = pendingDigitIndexRef.current
      const el = inputRef.current
      if (digitIndex === null || !el) return

      pendingDigitIndexRef.current = null
      const caret = caretIndexFromDigitCount(el.value, digitIndex)
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <TextField
      label={label}
      labelVisuallyHidden={labelVisuallyHidden}
      suffix={suffix}
      description={description}
      errorMessage={errorMessage}
      invalid={invalid}
      value={value}
      size={size}
      variant={fieldVariant}
      onValueChange={({ value: nextValue }) => handleValueChange(nextValue)}
      className={rootClassName}
    >
      <TextFieldInput
        ref={inputRef}
        placeholder={placeholder}
        inputMode="numeric"
        className="tabular-nums"
        aria-label={label}
      />
    </TextField>
  )
}
