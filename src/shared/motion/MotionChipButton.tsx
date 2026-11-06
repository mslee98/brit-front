import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { Chip, type ButtonChipProps } from 'seed-design/ui/chip'

import { useTapScaleProps } from '../hooks/useTapScaleProps'

export const MotionChipButton = forwardRef<HTMLButtonElement, ButtonChipProps>(
  function MotionChipButton(props, ref) {
    const tapProps = useTapScaleProps('chip')

    return (
      <motion.span style={{ display: 'inline-flex' }} {...(props.disabled ? {} : tapProps)}>
        <Chip.Button ref={ref} {...props} />
      </motion.span>
    )
  },
)

MotionChipButton.displayName = 'MotionChipButton'
