/**
 * 내 업체 연결 목록·상세·해지 (B2).
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
  const [selected, setSelected] = useState<MePartnerLinkItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false)

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

  const openDetail = useCallback((item: MePartnerLinkItem) => {
    setSelected(item)
    setDetailOpen(true)
  }, [])

  const handleDetailOpenChange = useCallback((open: boolean) => {
    setDetailOpen(open)
    if (!open) {
      setRevokeConfirmOpen(false)
      setSelected(null)
    }
  }, [])

  const requestRevoke = useCallback(() => {
    if (!selected || selected.status !== 'ACTIVE') return
    setRevokeConfirmOpen(true)
  }, [selected])

  const handleRevokeConfirmOpenChange = useCallback((open: boolean) => {
    setRevokeConfirmOpen(open)
  }, [])

  const confirmRevoke = useCallback(async () => {
    if (!selected || revokingId) return
    const item = selected
    setRevokingId(item.linkId)
    try {
      await revokeMyPartnerLink(item.linkId)
      setItems((prev) => prev.filter((row) => row.linkId !== item.linkId))
      setRevokeConfirmOpen(false)
      setDetailOpen(false)
      setSelected(null)
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
  }, [revokingId, selected, snackbar])

  const openApprove = useCallback(() => {
    push('PartnerLinkApprove', {}, { animate: true })
  }, [push])

  return {
    items,
    loading,
    revokingId,
    selected,
    detailOpen,
    revokeConfirmOpen,
    handleBack: () => pop(),
    openDetail,
    handleDetailOpenChange,
    requestRevoke,
    handleRevokeConfirmOpenChange,
    confirmRevoke,
    openApprove,
  }
}
