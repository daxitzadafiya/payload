import type { PropertiesCarouselItem } from '@/components/PropertiesCarousel'
import { extractPropertyListPreloadImageUrls } from '@/components/PropertyList/propertyListImagePreload'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import {
  buildCRMListingQuery,
  normalizeCRMProperty,
  type CRMListingPreset,
} from '@/utilities/crmProperties'
import { fetchCRMPropertiesServer } from '@/utilities/crmProperties.server'
import { isCRMTruthy } from '@/utilities/localizedValue'
import { PROPERTY_CARD_IMAGE_SIZE } from '@/utilities/optimaImage'
import {
  listingContextToListingMode,
  resolveDetailListingContextFromProperty,
} from '@/utilities/propertyDetailListingContext'

type CarouselCrmPreset = Extract<CRMListingPreset, 'featured' | 'beachSide' | 'golf' | 'luxury' | 'newDevelopments' | 'newListings'>

export async function fetchPropertiesCarouselServerData(
  preset: CarouselCrmPreset,
  limit: number,
): Promise<{ items: PropertiesCarouselItem[]; preloadImageUrls: string[] }> {
  const { locale } = await getActiveLocale()

  const body = buildCRMListingQuery({
    preset,
    page: 1,
    pageSize: Math.max(1, limit),
    sortParams: { featured: -1 },
  })

  const result = await fetchCRMPropertiesServer(body)

  const items = result.properties.map((property): PropertiesCarouselItem => {
    // Featured / beachSide / golf / luxury / newDevelopments / newListings queries are sale-first; keep sale price when `sale` is set.
    // Rent-only / holiday-only rows still use active-season LT / ST pricing.
    const listingContext = resolveDetailListingContextFromProperty(property)
    const preferSale = isCRMTruthy(property.sale)
    const listingMode = preferSale
      ? 'sale'
      : (listingContextToListingMode(listingContext) ?? 'sale')
    const holidayListing = !preferSale && listingContext === 'forHoliday'

    const normalized = normalizeCRMProperty(property, locale, {
      currencySymbolAfter: true,
      emptyPriceWhenMissing: true,
      attachmentImageSize: PROPERTY_CARD_IMAGE_SIZE,
      listingMode,
      holidayListing,
    })

    return {
      id: normalized.id,
      imageUrl: normalized.imageUrl,
      imageUrls: normalized.imageUrls,
      statusBadgeLabel: normalized.statusBadgeLabel,
      crmStatus: normalized.crmStatus,
      location: normalized.location,
      reference: normalized.reference,
      displayReference: normalized.displayReference,
      detailHref: normalized.detailHref,
      title: normalized.title,
      beds: normalized.beds,
      baths: normalized.baths,
      sqft: normalized.sqft,
      price: normalized.price,
    }
  })

  return {
    items,
    preloadImageUrls: extractPropertyListPreloadImageUrls(result.properties),
  }
}
