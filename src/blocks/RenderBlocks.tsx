import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { HeroBlock } from '@/blocks/HeroBlock/Component'
import { StatsBlock } from '@/blocks/StatsBlock/Component'
import { MissionBlock } from '@/blocks/MissionBlock/Component'
import { PropertiesBlock } from '@/blocks/PropertiesBlock/Component'
import { PropertyCategoryBlock } from '@/blocks/PropertyCategoryBlock/Component'
import { PropertyListBlock } from '@/blocks/PropertyListBlock/Component'
import { ServicesBlock } from '@/blocks/ServicesBlock/Component'
import { InfoCardsBlock } from '@/blocks/InfoCardsBlock/Component'
import { InteractiveMapBlock } from '@/blocks/InteractiveMapBlock/Component'
import { VirtualTourBlock } from '@/blocks/VirtualTourBlock/Component'
import { AdvisorsBlock } from '@/blocks/AdvisorsBlock/Component'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/Component'
import { KnowledgeBaseBlock } from '@/blocks/KnowledgeBaseBlock/Component'
import { DualActionBlock } from '@/blocks/DualActionBlock/Component'
import { FounderSpotlightBlock } from '@/blocks/FounderSpotlightBlock/Component'
import { WelcomeBlock } from '@/blocks/WelcomeBlock/Component'
import { WhoWeAreBlock } from '@/blocks/WhoWeAreBlock/Component'
import { AboutUsHeroBlock } from '@/blocks/AboutUsHeroBlock/Component'
import { MapBlock } from '@/blocks/MapBlock/Component'
import { ContactSectionBlock } from '@/blocks/ContactSectionBlock/Component'
import { PrivacyPolicyBlock } from '@/blocks/PrivacyPolicyBlock/Component'
import { CertificatesBlock } from '@/blocks/CertificatesBlock/Component'
import { FrequentQuestionsBlock } from '@/blocks/FrequentQuestionsBlock/Component'
import { BuyingGuideBlock } from '@/blocks/BuyingGuideBlock/Component'
import { AfterSalesCareBlock } from '@/blocks/AfterSalesCareBlock/Component'
import { SellYourPropertyBlock } from '@/blocks/SellYourPropertyBlock/Component'
import { OwnersBlock } from '@/blocks/OwnersBlock/Component'
import { CharityBlock } from '@/blocks/CharityBlock/Component'
import { OurTestimonialsBlock } from '@/blocks/OurTestimonialsBlock/Component'
import { AreaInfoBlock } from '@/blocks/AreaInfoBlock/Component'
import { AreaDetailBlock } from '@/blocks/AreaDetailBlock/Component'
import { BlogPostsBlock } from '@/blocks/BlogPostsBlock/Component'
import { getOwnerFormSettings } from '@/blocks/OwnersBlock/getOwnerFormSettings'
import { extractContactOfficeLocations } from '@/utilities/contactOfficeLocations'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  heroBlock: HeroBlock,
  statsBlock: StatsBlock,
  missionBlock: MissionBlock,
  propertiesBlock: PropertiesBlock,
  propertyCategoryBlock: PropertyCategoryBlock,
  propertyListBlock: PropertyListBlock,
  servicesBlock: ServicesBlock,
  infoCardsBlock: InfoCardsBlock,
  interactiveMapBlock: InteractiveMapBlock,
  virtualTourBlock: VirtualTourBlock,
  advisorsBlock: AdvisorsBlock,
  testimonialsBlock: TestimonialsBlock,
  knowledgeBaseBlock: KnowledgeBaseBlock,
  dualActionBlock: DualActionBlock,
  founderSpotlightBlock: FounderSpotlightBlock,
  welcomeBlock: WelcomeBlock,
  whoWeAreBlock: WhoWeAreBlock,
  aboutUsHeroBlock: AboutUsHeroBlock,
  mapBlock: MapBlock,
  contactSectionBlock: ContactSectionBlock,
  privacyPolicyBlock: PrivacyPolicyBlock,
  certificatesBlock: CertificatesBlock,
  frequentQuestionsBlock: FrequentQuestionsBlock,
  buyingGuideBlock: BuyingGuideBlock,
  afterSalesCareBlock: AfterSalesCareBlock,
  sellYourPropertyBlock: SellYourPropertyBlock,
  ownersBlock: OwnersBlock,
  charityBlock: CharityBlock,
  ourTestimonialsBlock: OurTestimonialsBlock,
  areaInfoBlock: AreaInfoBlock,
  areaDetailBlock: AreaDetailBlock,
  blogPostsBlock: BlogPostsBlock,
}

export async function RenderBlocks(props: {
  blocks: Page['layout'][0][]
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const { blocks, searchParams } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0
  const contactOfficeLocations = extractContactOfficeLocations(blocks)
  const ownerForm =
    hasBlocks && blocks.some((block) => block.blockType === 'sellYourPropertyBlock')
      ? await getOwnerFormSettings()
      : null

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              const extraProps =
                blockType === 'mapBlock'
                  ? { officeLocations: contactOfficeLocations }
                  : blockType === 'propertyListBlock'
                    ? { searchParams }
                    : blockType === 'sellYourPropertyBlock'
                      ? { ownerForm }
                      : {}

              return (
                <Fragment key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} {...extraProps} disableInnerContainer />
                </Fragment>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
