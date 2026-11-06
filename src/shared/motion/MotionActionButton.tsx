import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { ActionButton, type ActionButtonProps } from 'seed-design/ui/action-button'

import { useTapScaleProps } from '../hooks/useTapScaleProps'

export const MotionActionButton = forwardRef<
  React.ElementRef<typeof ActionButton>,
  ActionButtonProps
>(function MotionActionButton({ style, flexGrow, ...props }, ref) {
  const tapProps = useTapScaleProps('cta')
  // 탭 scale은 래퍼에 걸려 있어 눌리지 않는 버튼에서도 재생된다 → 「눌렸는데 안 넘어감」으로 보인다
  const pressable = !props.disabled && !props.loading

  const wrapperStyle = flexGrow
    ? { display: 'flex' as const, flexGrow: 1, minWidth: 0 }
    : { display: 'block' as const, width: '100%' }

  return (
    <motion.div style={wrapperStyle} {...(pressable ? tapProps : {})}>
      <ActionButton
        ref={ref}
        flexGrow={flexGrow}
        style={{ width: '100%', ...style }}
        {...props}
      />
    </motion.div>
  )
})

MotionActionButton.displayName = 'MotionActionButton'
