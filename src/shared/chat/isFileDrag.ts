export function isFileDrag(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  return Array.from(dataTransfer.types).includes('Files')
}

export function filesFromDataTransfer(
  dataTransfer: DataTransfer | null,
): File[] {
  if (!dataTransfer) return []
  const fromFiles = Array.from(dataTransfer.files)
  if (fromFiles.length > 0) return fromFiles

  const fromItems: File[] = []
  for (const item of dataTransfer.items) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (file) fromItems.push(file)
  }
  return fromItems
}

