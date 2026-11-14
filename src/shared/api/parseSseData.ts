/**
 * fetch + ReadableStream SSE의 `data:` 프레임 파서.
 * EventSource는 Authorization 헤더를 못 보내므로 공통으로 쓴다.
 */
export function parseSseDataChunks<T>(
  buffer: string,
  extract: (envelope: unknown) => T | null,
): { events: T[]; rest: string } {
  const events: T[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    const dataLine = part.split('\n').find((line) => line.startsWith('data:'))
    if (!dataLine) continue
    const raw = dataLine.slice('data:'.length).trim()
    if (!raw) continue
    try {
      const envelope: unknown = JSON.parse(raw)
      const item = extract(envelope)
      if (item != null) events.push(item)
    } catch {
      // ignore malformed frames
    }
  }

  return { events, rest }
}
