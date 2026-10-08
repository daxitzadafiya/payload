const FALLBACK_SECONDARY = '#c7af87'
const FALLBACK_PRIMARY = '#84442e'

function toAbsoluteUrl(path: string): string {
  if (!path || path.startsWith('http')) return path

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return path
}

function getThemeColor(cssVar: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback

  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  return value || fallback
}

function colorToRgba(color: string, alpha: number): string {
  const trimmed = color.trim()

  if (trimmed.startsWith('rgba(') || trimmed.startsWith('rgb(')) {
    const parts = trimmed
      .replace(/^rgba?\(/, '')
      .replace(/\)$/, '')
      .split(',')
      .map((part) => part.trim())
    const [r = '0', g = '0', b = '0'] = parts
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const hex = trimmed.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex

  if (full.length !== 6 || Number.isNaN(Number.parseInt(full, 16))) {
    return colorToRgba(FALLBACK_SECONDARY, alpha)
  }

  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Template Two map pin — terracotta head, gold rings, cream face + favicon.
 */
function drawMarkerIcon(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
  hovered: boolean,
  primary: string,
  secondary: string,
): void {
  const centerX = width / 2
  const headRadius = hovered ? 20 : 17
  const headCenterY = headRadius + (hovered ? 8 : 7)
  const tipY = height - 6

  ctx.clearRect(0, 0, width, height)

  // Soft ground shadow
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(centerX, tipY + 1, hovered ? 12 : 9, hovered ? 3.5 : 2.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.fill()
  ctx.restore()

  // Outer gold halo
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius + (hovered ? 8 : 6), 0, Math.PI * 2)
  ctx.fillStyle = colorToRgba(secondary, hovered ? 0.32 : 0.22)
  ctx.fill()
  ctx.restore()

  // Gold ring
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius + 2.5, 0, Math.PI * 2)
  ctx.strokeStyle = secondary
  ctx.lineWidth = hovered ? 2.5 : 2
  ctx.stroke()
  ctx.restore()

  // Cream face disk
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#fef9f1'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = hovered ? 14 : 10
  ctx.shadowOffsetY = 3
  ctx.fill()
  ctx.restore()

  // Inner terracotta ring
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius - 1.5, 0, Math.PI * 2)
  ctx.strokeStyle = colorToRgba(primary, 0.55)
  ctx.lineWidth = 1.25
  ctx.stroke()
  ctx.restore()

  // Pointer tip (cream fill + gold stroke)
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(centerX - 9, headCenterY + headRadius - 3)
  ctx.lineTo(centerX, tipY)
  ctx.lineTo(centerX + 9, headCenterY + headRadius - 3)
  ctx.closePath()
  ctx.fillStyle = '#fef9f1'
  ctx.fill()
  ctx.strokeStyle = secondary
  ctx.lineWidth = hovered ? 1.75 : 1.4
  ctx.stroke()
  ctx.restore()

  // Favicon clipped in center
  const iconRadius = headRadius - 5
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, iconRadius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(
    image,
    centerX - iconRadius,
    headCenterY - iconRadius,
    iconRadius * 2,
    iconRadius * 2,
  )
  ctx.restore()
}

export function loadOfficeLocationMarkerIcons(
  faviconUrl: string,
): Promise<{ defaultIcon: google.maps.Icon; hoverIcon: google.maps.Icon }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const primary = getThemeColor('--color-primary', FALLBACK_PRIMARY)
      const secondary = getThemeColor('--color-secondary', FALLBACK_SECONDARY)
      const defaultSize = { width: 56, height: 66 }
      const hoverSize = { width: 64, height: 74 }

      const defaultCanvas = document.createElement('canvas')
      defaultCanvas.width = defaultSize.width
      defaultCanvas.height = defaultSize.height
      const defaultCtx = defaultCanvas.getContext('2d')
      if (!defaultCtx) {
        reject(new Error('Could not create marker canvas'))
        return
      }
      drawMarkerIcon(
        defaultCtx,
        image,
        defaultSize.width,
        defaultSize.height,
        false,
        primary,
        secondary,
      )

      const hoverCanvas = document.createElement('canvas')
      hoverCanvas.width = hoverSize.width
      hoverCanvas.height = hoverSize.height
      const hoverCtx = hoverCanvas.getContext('2d')
      if (!hoverCtx) {
        reject(new Error('Could not create marker canvas'))
        return
      }
      drawMarkerIcon(hoverCtx, image, hoverSize.width, hoverSize.height, true, primary, secondary)

      resolve({
        defaultIcon: {
          url: defaultCanvas.toDataURL('image/png'),
          scaledSize: new google.maps.Size(defaultSize.width, defaultSize.height),
          anchor: new google.maps.Point(defaultSize.width / 2, defaultSize.height - 4),
        },
        hoverIcon: {
          url: hoverCanvas.toDataURL('image/png'),
          scaledSize: new google.maps.Size(hoverSize.width, hoverSize.height),
          anchor: new google.maps.Point(hoverSize.width / 2, hoverSize.height - 4),
        },
      })
    }
    image.onerror = () => reject(new Error('Could not load favicon for map marker'))
    image.src = toAbsoluteUrl(faviconUrl)
  })
}

/** Soften Google POIs so office pins read clearly. */
export const OFFICE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
]
