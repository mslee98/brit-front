const EVIDENCE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_EVIDENCE_FILES = 8

export function isDisputeEvidenceFile(file: File): boolean {
  return EVIDENCE_MIME_TYPES.has(file.type)
}

/** file input·붙여넣기에서 jpeg/png/webp만, 최대 8장. */
export function pickDisputeEvidenceFiles(
  files: FileList | File[] | null | undefined,
): File[] {
  if (!files) return []
  return [...files].filter(isDisputeEvidenceFile).slice(0, MAX_EVIDENCE_FILES)
}

export function pickEvidenceFilesFromClipboard(
  clipboardData: DataTransfer | null,
): File[] {
  if (!clipboardData) return []
  const fromFiles = pickDisputeEvidenceFiles(clipboardData.files)
  if (fromFiles.length > 0) return fromFiles

  const fromItems: File[] = []
  for (const item of clipboardData.items) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (file && isDisputeEvidenceFile(file)) fromItems.push(file)
  }
  return fromItems.slice(0, MAX_EVIDENCE_FILES)
}

export function isFileDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  return Array.from(dataTransfer.types).includes('Files')
}
