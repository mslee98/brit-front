import type { Institution } from '../data/institutions'
import type { BankDto, BankRow } from '../types/banks'
import { getBankStorageIconUrl } from '../utils/bankIconUrl'
import { isBankUnderMaintenance } from '../utils/bankMaintenance'

type BankMaintenanceSource = Pick<
  BankRow,
  | 'daily_maintenance_start'
  | 'daily_maintenance_end'
  | 'regular_maintenance_rule'
  | 'regular_maintenance_start'
  | 'regular_maintenance_end'
  | 'maintenance_note'
>

function toInstitution(params: {
  id: number
  code: string
  name: string
  iconKey: string
  svgFilename: string
  iconUrl?: string | null
  maintenance: BankMaintenanceSource
}): Institution {
  const underMaintenance = isBankUnderMaintenance(params.maintenance)

  return {
    id: `bank-${params.id}`,
    code: params.code,
    name: params.name,
    category: 'bank',
    iconKey: params.iconKey,
    iconUrl: params.iconUrl || getBankStorageIconUrl(params.svgFilename),
    featured: true,
    disabled: underMaintenance,
    maintenanceNote: underMaintenance ? params.maintenance.maintenance_note ?? undefined : undefined,
  }
}

export function mapBankRowToInstitution(row: BankRow): Institution {
  return toInstitution({
    id: row.id,
    code: row.code,
    name: row.name,
    iconKey: row.icon_key ?? row.svg_filename,
    svgFilename: row.svg_filename,
    maintenance: row,
  })
}

export function mapBankDtoToInstitution(dto: BankDto): Institution {
  return toInstitution({
    id: dto.id,
    code: dto.code,
    name: dto.name,
    iconKey: dto.iconKey ?? dto.svgFilename,
    svgFilename: dto.svgFilename,
    iconUrl: dto.iconUrl,
    maintenance: {
      daily_maintenance_start: dto.dailyMaintenanceStart,
      daily_maintenance_end: dto.dailyMaintenanceEnd,
      regular_maintenance_rule: dto.regularMaintenanceRule,
      regular_maintenance_start: dto.regularMaintenanceStart,
      regular_maintenance_end: dto.regularMaintenanceEnd,
      maintenance_note: dto.maintenanceNote,
    },
  })
}
