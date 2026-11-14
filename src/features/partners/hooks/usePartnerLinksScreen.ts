/**
 * 내 업체 연결 목록·해지 (B2).
 */
import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  listMyPartnerLinks,
  revokeMyPartnerLink,
  shouldUsePartnerLinksHttpApi,
  type MePartnerLinkItem,
} from '../api/partnerLinks.api'

export function usePartnerLinksScreen() {
  const { pop, push } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [items, setItems] = useState<MePartnerLinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!shouldUsePartnerLinksHttpApi()) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setItems(await listMyPartnerLinks())
    } catch {
      setItems([])
      showSnackbar(snackbar, '연결 목록을 불러오지 못했어요.', 'critical')
    } finally {
      setLoading(false)
    }
  }, [snackbar])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleRevoke = useCallback(
    async (item: MePartnerLinkItem) => {
      const ok = window.confirm(
        `${item.partnerName} 연결을 해제할까요?\n이후 이 업체에서 충전하려면 다시 연결해야 해요.`,
      )
      if (!ok || revokingId) return
      setRevokingId(item.linkId)
      try {
        await revokeMyPartnerLink(item.linkId)
        setItems((prev) => prev.filter((row) => row.linkId !== item.linkId))
        showSnackbar(snackbar, `${item.partnerName} 연결을 해제했어요.`)
      } catch (err) {
        showSnackbar(
          snackbar,
          err instanceof ApiError && err.message
            ? err.message
            : '연결을 해제하지 못했어요.',
          'critical',
        )
      } finally {
        setRevokingId(null)
      }
    },
    [revokingId, snackbar],
  )

  const openApprove = useCallback(() => {
    push('PartnerLinkApprove', {}, { animate: true })
  }, [push])

  return {
    items,
    loading,
    revokingId,
    handleBack: () => pop(),
    handleRevoke,
    openApprove,
  }
}
