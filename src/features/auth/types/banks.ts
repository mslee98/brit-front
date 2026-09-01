/** Supabase `banks` row (snake_case) */
export interface BankRow {
  id: number
  code: string
  name: string
  icon_key: string | null
  svg_filename: string
  daily_maintenance_start: string | null
  daily_maintenance_end: string | null
  regular_maintenance_rule: string | null
  regular_maintenance_start: string | null
  regular_maintenance_end: string | null
  maintenance_note: string | null
  sort_order: number
  is_active: boolean
}

/** Nest 등 HTTP API 응답 DTO (camelCase) */
export interface BankDto {
  id: number
  code: string
  name: string
  iconKey: string | null
  svgFilename: string
  /** Nest: `{ASSET_PUBLIC_BASE_URL}/assets/banks/{svgFilename}` (원본: brit/bucket) */
  iconUrl?: string | null
  dailyMaintenanceStart: string | null
  dailyMaintenanceEnd: string | null
  regularMaintenanceRule: string | null
  regularMaintenanceStart: string | null
  regularMaintenanceEnd: string | null
  maintenanceNote: string | null
  sortOrder: number
  isActive: boolean
}
