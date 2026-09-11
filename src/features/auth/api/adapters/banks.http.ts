import { ApiError, API_ERROR_CODES } from '../../../../shared/api/errors'
import { httpGet } from '../../../../shared/api/httpClient'
import type { Institution } from '../../data/institutions'
import { mapBankDtoToInstitution } from '../../mappers/bank.mapper'
import type { BankDto } from '../../types/banks'

interface BanksListResponse {
  items: BankDto[]
}

export async function fetchActiveBanksFromHttp(): Promise<Institution[]> {
  try {
    const response = await httpGet<BanksListResponse | BankDto[]>('/v1/banks')
    const items = Array.isArray(response) ? response : response.items
    return items.map(mapBankDtoToInstitution)
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(API_ERROR_CODES.BANKS_FETCH_FAILED, error.message, error.status)
    }
    throw new ApiError(API_ERROR_CODES.BANKS_FETCH_FAILED)
  }
}
