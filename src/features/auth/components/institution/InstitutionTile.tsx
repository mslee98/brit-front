import { Flex, Text } from '@seed-design/react'

import { BankIcon } from '../../../../shared/ui/BankIcon'
import type { Institution } from '../../data/institutions'
import { getInstitutionIconUrl } from '../../utils/institutionIcons'

interface InstitutionTileProps {
  institution: Institution
  selected?: boolean
  onSelect: (institution: Institution) => void
}

export function InstitutionTile({ institution, selected = false, onSelect }: InstitutionTileProps) {
  const iconUrl = institution.iconUrl || getInstitutionIconUrl(institution.iconKey)
  const disabled = institution.disabled

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={institution.name}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect(institution)
      }}
      className="w-full cursor-pointer border border-solid disabled:cursor-not-allowed"
      style={{
        minHeight: 88,
        padding: 'var(--seed-spacing-x3) var(--seed-spacing-x2)',
        borderRadius: 'var(--seed-radius-r3)',
        borderColor: selected
          ? 'var(--seed-color-stroke-brand-weak)'
          : 'var(--seed-color-stroke-neutral-weak)',
        backgroundColor: selected
          ? 'var(--seed-color-bg-brand-weak)'
          : 'var(--seed-color-bg-layer-default)',
        opacity: disabled ? 0.4 : 1,
        transition: 'border-color 150ms ease, background-color 150ms ease',
      }}
    >
      <Flex direction="column" align="center" justify="center" gap="x2" height="full">
        <BankIcon bankName={institution.name} iconUrl={iconUrl} size={32} />
        <Text
          textStyle="t3Regular"
          color="fg.neutral"
          align="center"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'keep-all',
          }}
        >
          {institution.name}
        </Text>
      </Flex>
    </button>
  )
}
