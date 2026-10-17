export type ChatAlign = 'mine' | 'other' | 'admin' | 'system'

export type ChatMessage = {
  id: string
  align: ChatAlign
  authorName?: string
  body: string
  imageUrl?: string | null
  createdAt: string
}

export type ChatIdentity = {
  title: string
  subtitle?: string
  avatarSrc?: string
}

export type ChatComposerState = {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onAttach: () => void
  sending?: boolean
  placeholder?: string
}
