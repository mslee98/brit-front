/**
 * banks.api
 *
 * 책임: 활성 은행 목록 조회 facade
 * 비책임: Supabase/HTTP 구현 (→ adapters)
 */
import type { Institution } from '../data/institutions'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import { fetchActiveBanksFromHttp } from './adapters/banks.http'
import { fetchActiveBanksFromSupabase } from './adapters/banks.supabase'

export async function fetchActiveBanks(): Promise<Institution[]> {
  if (shouldUseHttpApi()) {
    return fetchActiveBanksFromHttp()
  }
  return fetchActiveBanksFromSupabase()
}
