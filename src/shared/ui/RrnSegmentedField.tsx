import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { Field as SeedField } from '@seed-design/react'

import './rrn-segmented-field.css'

const FRONT_LENGTH = 6
const BACK_LENGTH = 7
const MASKED_LENGTH = BACK_LENGTH - 1

function onlyDigits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max)
}

export interface RrnSegmentedFieldProps {
  /** 숫자만 최대 13자리 */
  value: string
  onValueChange: (digits: string) => void
  label?: ReactNode
  description?: ReactNode
  readOnly?: boolean
  invalid?: boolean
  frontPlaceholder?: string
}

/**
 * 주민등록번호 `앞 6자리 - 뒤 7자리` 밑줄 입력.
 * 뒷자리는 첫 숫자(성별)만 보이고 나머지는 점으로 가린다. ref는 앞자리 입력에 걸린다.
 */
export const RrnSegmentedField = forwardRef<HTMLInputElement, RrnSegmentedFieldProps>(
  function RrnSegmentedField(
    {
      value,
      onValueChange,
      label,
      description,
      readOnly = false,
      invalid = false,
      frontPlaceholder = '900101',
    },
    ref,
  ) {
    const frontInputRef = useRef<HTMLInputElement | null>(null)
    const backInputRef = useRef<HTMLInputElement | null>(null)
    /** 앞자리를 고치는 동안 뒷자리를 보관한다. 값은 13자리 문자열 하나라 앞자리가 비면 뒷자리를 담을 수 없다 */
    const [heldBack, setHeldBack] = useState('')
    const [focused, setFocused] = useState<'front' | 'back' | null>(null)

    const digits = onlyDigits(value, FRONT_LENGTH + BACK_LENGTH)
    /** 마지막으로 내보낸 값. 바깥에서 값을 바꾸면(초기화 등) 보관한 뒷자리를 버린다 */
    const [emitted, setEmitted] = useState(digits)
    if (digits !== emitted) {
      setEmitted(digits)
      if (heldBack) setHeldBack('')
    }

    const emit = (next: string) => {
      setEmitted(next)
      onValueChange(next)
    }
    const front = digits.slice(0, FRONT_LENGTH)
    const back = front.length === FRONT_LENGTH ? digits.slice(FRONT_LENGTH) : heldBack

    const setFrontRef = (node: HTMLInputElement | null) => {
      frontInputRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const focusInput = (input: HTMLInputElement | null) => {
      requestAnimationFrame(() => {
        if (!input) return
        input.focus()
        const end = input.value.length
        input.setSelectionRange(end, end)
      })
    }

    const handleFrontChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return
      const raw = onlyDigits(event.target.value, FRONT_LENGTH + BACK_LENGTH)
      if (raw.length > FRONT_LENGTH) {
        setHeldBack('')
        emit(raw)
        focusInput(backInputRef.current)
        return
      }
      if (raw.length < FRONT_LENGTH) {
        if (front.length === FRONT_LENGTH) setHeldBack(back)
        emit(raw)
        return
      }
      emit(raw + back)
      if (front.length < FRONT_LENGTH && back.length < BACK_LENGTH) {
        focusInput(backInputRef.current)
      }
    }

    const handleBackChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return
      const raw = onlyDigits(event.target.value, FRONT_LENGTH + BACK_LENGTH)
      if (raw.length === FRONT_LENGTH + BACK_LENGTH) {
        emit(raw)
        return
      }
      emit(front + raw.slice(0, BACK_LENGTH))
    }

    const handleBackFocus = () => {
      if (front.length < FRONT_LENGTH) {
        focusInput(frontInputRef.current)
        return
      }
      setFocused('back')
    }

    const handleBackKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && back.length === 0) {
        event.preventDefault()
        focusInput(frontInputRef.current)
      }
    }

    /** 뒷자리 입력은 보이지 않으므로 커서를 항상 끝에 둔다 (중간에 끼워 넣지 않게) */
    const keepCaretAtEnd = (event: SyntheticEvent<HTMLInputElement>) => {
      const input = event.currentTarget
      const end = input.value.length
      if (input.selectionStart !== end || input.selectionEnd !== end) {
        input.setSelectionRange(end, end)
      }
    }

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
      setFocused(null)
    }

    const gender = back.slice(0, 1)
    const filledMask = Math.max(0, back.length - 1)
    const nextSlot =
      focused === 'back' && !readOnly && back.length < BACK_LENGTH ? back.length : -1

    return (
      <SeedField.Root readOnly={readOnly} invalid={invalid}>
        {label ? (
          <SeedField.Header>
            <SeedField.Label>{label}</SeedField.Label>
          </SeedField.Header>
        ) : null}

        <div
          className="rrn-field__control"
          data-focus={focused != null && !readOnly ? '' : undefined}
          data-invalid={invalid ? '' : undefined}
          data-readonly={readOnly ? '' : undefined}
          onBlur={handleBlur}
        >
          <input
            ref={setFrontRef}
            className="rrn-field__front"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="next"
            placeholder={frontPlaceholder}
            value={front}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : 0}
            aria-label="주민등록번호 앞 6자리"
            aria-invalid={invalid || undefined}
            onChange={handleFrontChange}
            onFocus={() => setFocused('front')}
          />

          <span className="rrn-field__separator" aria-hidden>
            -
          </span>

          <div className="rrn-field__back">
            <span
              className={
                nextSlot === 0 ? 'rrn-field__gender rrn-field__slot--next' : 'rrn-field__gender'
              }
              data-empty={gender ? undefined : ''}
              aria-hidden
            >
              {gender || '0'}
            </span>
            {Array.from({ length: MASKED_LENGTH }, (_, index) => (
              <span
                key={index}
                className={
                  nextSlot === index + 1 ? 'rrn-field__dot rrn-field__slot--next' : 'rrn-field__dot'
                }
                data-filled={index < filledMask ? '' : undefined}
                aria-hidden
              />
            ))}
            <input
              ref={backInputRef}
              className="rrn-field__back-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              enterKeyHint="next"
              value={back}
              readOnly={readOnly}
              tabIndex={readOnly ? -1 : 0}
              aria-label="주민등록번호 뒤 7자리"
              aria-invalid={invalid || undefined}
              onChange={handleBackChange}
              onFocus={handleBackFocus}
              onKeyDown={handleBackKeyDown}
              onSelect={keepCaretAtEnd}
            />
          </div>
        </div>

        {description ? (
          <SeedField.Footer>
            <SeedField.Description>{description}</SeedField.Description>
          </SeedField.Footer>
        ) : null}
      </SeedField.Root>
    )
  },
)
