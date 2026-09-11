/**
 * BankIcon — 은행 로고 표시. 가입 InstitutionTile·거래 입금 카드에서 공용.
 * 정사각 로고가 radius 영역 전체를 채우고, 모서리는 overflow로 클립한다.
 * iconUrl 우선, 없으면 은행명 이니셜 fallback.
 */
import { Box, Text } from '@seed-design/react'

interface BankIconProps {
  bankName: string
  iconUrl?: string | null
  /**
   * px. 거래 상대 Avatar(`size="42"`)와 맞추려면 42.
   * @default 42
   */
  size?: number
}

export function BankIcon({ bankName, iconUrl, size = 42 }: BankIconProps) {
  const initial = bankName.trim().charAt(0) || '은'
  const radius = size >= 36 ? 'r3' : 'r2'

  return (
    <Box
      flexShrink={0}
      borderRadius={radius}
      bg="bg.neutralWeak"
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          width={size}
          height={size}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <Text textStyle={size >= 36 ? 't5Bold' : 't3Bold'} color="fg.neutralMuted">
          {initial}
        </Text>
      )}
    </Box>
  )
}
