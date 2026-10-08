import type { Page } from '@/payload-types'

import {
  PropertiesBlockClient,
} from '@/blocks/PropertiesBlock/Client'
import type { PropertiesCarouselItem } from '@/components/PropertiesCarousel'
import {
  extractImageOrigin,
} from '@/components/PropertyList/propertyListImagePreload'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { fetchPropertiesCarouselServerData } from '@/utilities/propertiesCarouselServer'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }>

type CarouselCrmPreset = Extract<CRMListingPreset, 'featured' | 'beachSide' | 'golf' | 'luxury' | 'newDevelopments' | 'newListings'>

export const PropertiesBlock = async ({
  dataSource,
  crmPreset,
  crmLimit,
  ...rest
}: Props) => {
  const source = dataSource ?? 'cms'
  let crmProperties: PropertiesCarouselItem[] = []
  let preloadImageUrls: string[] = []

  if (source === 'crm') {
    const preset = (crmPreset ?? 'featured') as CarouselCrmPreset
    const limit = Math.max(1, crmLimit ?? 5)

    try {
      const { items, preloadImageUrls: urls } = await fetchPropertiesCarouselServerData(
        preset,
        limit,
      )
      crmProperties = items
      preloadImageUrls = urls
    } catch (error) {
      console.error('Failed to prefetch properties carousel', error)
    }
  }

  const imageOrigin = preloadImageUrls[0] ? extractImageOrigin(preloadImageUrls[0]) : null

  return (
    <>
      {imageOrigin && <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" />}
      {preloadImageUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
      <PropertiesBlockClient
        dataSource={dataSource}
        crmPreset={crmPreset}
        crmLimit={crmLimit}
        crmProperties={crmProperties}
        {...rest}
      />
    </>
  )
}
