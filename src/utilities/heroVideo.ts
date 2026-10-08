export type HeroVideoSource = 'youtube' | 'vimeo' | 'upload'

export const parseYouTubeVideoId = (url: string): string | undefined => {
  const trimmed = url.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id || undefined
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const queryId = parsed.searchParams.get('v')
      if (queryId) return queryId

      const pathMatch = parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)
      if (pathMatch?.[1]) return pathMatch[1]
    }
  } catch {
    const fallbackMatch = trimmed.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (fallbackMatch?.[1]) return fallbackMatch[1]
  }

  return undefined
}

export const parseVimeoVideoId = (url: string): string | undefined => {
  const trimmed = url.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'vimeo.com') {
      const pathMatch = parsed.pathname.match(/\/(\d+)/)
      if (pathMatch?.[1]) return pathMatch[1]
    }

    if (host === 'player.vimeo.com') {
      const pathMatch = parsed.pathname.match(/\/video\/(\d+)/)
      if (pathMatch?.[1]) return pathMatch[1]
    }
  } catch {
    const fallbackMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (fallbackMatch?.[1]) return fallbackMatch[1]
  }

  return undefined
}

export const toHeroYouTubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    fs: '0',
    disablekb: '1',
    color: 'white',
  })

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export const toHeroVimeoEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    background: '1',
    autoplay: '1',
    muted: '1',
    loop: '1',
    autopause: '0',
    dnt: '1',
    quality: '1080p',
  })

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`
}

export const resolveHeroVideoEmbedUrl = (
  videoSource: HeroVideoSource | null | undefined,
  youtubeUrl?: string | null,
  vimeoUrl?: string | null,
): string | undefined => {
  if (videoSource === 'youtube' && youtubeUrl) {
    const videoId = parseYouTubeVideoId(youtubeUrl)
    if (videoId) return toHeroYouTubeEmbedUrl(videoId)
  }

  if (videoSource === 'vimeo' && vimeoUrl) {
    const videoId = parseVimeoVideoId(vimeoUrl)
    if (videoId) return toHeroVimeoEmbedUrl(videoId)
  }

  return undefined
}
