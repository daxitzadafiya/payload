/**
 * Default English copy for Estepona / Marbella area detail pages.
 */

type LexicalText = {
  type: 'text'
  detail: 0
  format: number
  mode: 'normal'
  style: ''
  text: string
  version: 1
}

type LexicalParagraph = {
  type: 'paragraph'
  children: LexicalText[]
  direction: 'ltr'
  format: ''
  indent: 0
  textFormat: 0
  version: 1
}

type LexicalRoot = {
  root: {
    type: 'root'
    children: LexicalParagraph[]
    direction: 'ltr'
    format: ''
    indent: 0
    version: 1
  }
}

function text(value: string, format = 0): LexicalText {
  return {
    type: 'text',
    detail: 0,
    format,
    mode: 'normal',
    style: '',
    text: value,
    version: 1,
  }
}

function paragraph(...parts: Array<string | LexicalText>): LexicalParagraph {
  const children = parts.map((part) => (typeof part === 'string' ? text(part) : part))
  return {
    type: 'paragraph',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

function richText(...paragraphs: LexicalParagraph[]): LexicalRoot {
  return {
    root: {
      type: 'root',
      children: paragraphs,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export const esteponaAreaDetailContent = {
  title: 'Estepona',
  subtitle: 'Estepona: Authentic Living on the Costa del Sol',
  body: richText(
    paragraph(
      'Estepona has grown into one of the Costa del Sol’s most appealing towns — a place where an authentic Andalusian centre meets a modern marina, wide beaches, and a steady stream of carefully planned new developments.',
    ),
    paragraph(
      'The old town is full of flower-lined streets, plazas, and local restaurants, while the New Golden Mile and surrounding hills offer contemporary villas and apartments with sea and mountain views.',
    ),
    paragraph(
      'Buyers are drawn to Estepona for its balance: everyday amenities, strong community life, golf nearby, and a calmer pace than the busiest stretches of Marbella — without giving up coastal convenience.',
    ),
  ),
  closing: 'Estepona: relaxed living in a town full of charm and sunshine.',
  mapLat: 36.4276,
  mapLng: -5.1459,
  mapZoom: 12,
  aboutHeading: 'About Estepona:',
  aboutStats: [
    { label: 'Number of inhabitants', value: '±75,000' },
    { label: 'Altitude above sea level (m)', value: '23' },
    { label: 'Superficies (km²)', value: '137' },
  ],
  distancesHeading: 'Distance from Estepona (km):',
  distances: [
    { label: 'Airport Malaga', value: '80 km' },
    { label: 'Golfcourse', value: '10 – 12' },
    { label: 'Ski resort (Sierra Nevada)', value: '190 km' },
    { label: 'City centre Malaga', value: '85 km' },
  ],
}

export const marbellaAreaDetailContent = {
  title: 'Marbella',
  subtitle: 'Marbella: Luxury Living on the Costa del Sol',
  body: richText(
    paragraph(
      'Marbella remains the Costa del Sol’s most international address — a coastline of beaches, golf, fine dining, and neighbourhoods that range from the historic old town to the Golden Mile and Nueva Andalucía.',
    ),
    paragraph(
      'Whether you are looking for a frontline apartment, a golf villa, or a discreet hillside estate, Marbella combines lifestyle, services, and year-round Mediterranean climate with a proven luxury property market.',
    ),
    paragraph(
      'From Puerto Banús to Elviria, the area attracts buyers who want both prestige and everyday comfort: schools, clinics, beach clubs, and easy access along the coast.',
    ),
  ),
  closing: 'Marbella: where quality of life, luxury, and sunshine come together.',
  mapLat: 36.5101,
  mapLng: -4.8824,
  mapZoom: 12,
  aboutHeading: 'About Marbella:',
  aboutStats: [
    { label: 'Number of inhabitants', value: '±150,000' },
    { label: 'Altitude above sea level (m)', value: '27' },
    { label: 'Superficies (km²)', value: '117' },
  ],
  distancesHeading: 'Distance from Marbella (km):',
  distances: [
    { label: 'Airport Malaga', value: '45 km' },
    { label: 'Beach', value: 'Yes' },
    { label: 'Golfcourses', value: '15+' },
    { label: 'Ski resort (Sierra Nevada)', value: '200 km' },
    { label: 'City centre Malaga', value: '60 km' },
  ],
}
