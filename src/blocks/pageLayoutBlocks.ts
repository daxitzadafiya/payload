import type { Block } from 'payload'

import { AboutUsHeroBlock } from '@/blocks/AboutUsHeroBlock/config'
import { AdvisorsBlock } from '@/blocks/AdvisorsBlock/config'
import { AfterSalesCareBlock } from '@/blocks/AfterSalesCareBlock/config'
import { AreaDetailBlock } from '@/blocks/AreaDetailBlock/config'
import { AreaInfoBlock } from '@/blocks/AreaInfoBlock/config'
import { Archive } from '@/blocks/ArchiveBlock/config'
import { BlogPostsBlock } from '@/blocks/BlogPostsBlock/config'
import { BuyingGuideBlock } from '@/blocks/BuyingGuideBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { CertificatesBlock } from '@/blocks/CertificatesBlock/config'
import { CharityBlock } from '@/blocks/CharityBlock/config'
import { ContactSectionBlock } from '@/blocks/ContactSectionBlock/config'
import { Content } from '@/blocks/Content/config'
import { DualActionBlock } from '@/blocks/DualActionBlock/config'
import { FormBlock } from '@/blocks/Form/config'
import { FounderSpotlightBlock } from '@/blocks/FounderSpotlightBlock/config'
import { FrequentQuestionsBlock } from '@/blocks/FrequentQuestionsBlock/config'
import { HeroBlock } from '@/blocks/HeroBlock/config'
import { InfoCardsBlock } from '@/blocks/InfoCardsBlock/config'
import { InteractiveMapBlock } from '@/blocks/InteractiveMapBlock/config'
import { KnowledgeBaseBlock } from '@/blocks/KnowledgeBaseBlock/config'
import { MapBlock } from '@/blocks/MapBlock/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { MissionBlock } from '@/blocks/MissionBlock/config'
import { OurTestimonialsBlock } from '@/blocks/OurTestimonialsBlock/config'
import { OwnersBlock } from '@/blocks/OwnersBlock/config'
import { PrivacyPolicyBlock } from '@/blocks/PrivacyPolicyBlock/config'
import { PropertiesBlock } from '@/blocks/PropertiesBlock/config'
import { PropertyCategoryBlock } from '@/blocks/PropertyCategoryBlock/config'
import { PropertyListBlock } from '@/blocks/PropertyListBlock/config'
import { SellYourPropertyBlock } from '@/blocks/SellYourPropertyBlock/config'
import { ServicesBlock } from '@/blocks/ServicesBlock/config'
import { StatsBlock } from '@/blocks/StatsBlock/config'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/config'
import { VirtualTourBlock } from '@/blocks/VirtualTourBlock/config'
import { WelcomeBlock } from '@/blocks/WelcomeBlock/config'
import { WhoWeAreBlock } from '@/blocks/WhoWeAreBlock/config'

/**
 * Single source of truth for page layout blocks.
 * Auto-translate discovers localized fields from these configs — no manual registry.
 */
export const pageLayoutBlocks = [
  CallToAction,
  Content,
  MediaBlock,
  Archive,
  FormBlock,
  HeroBlock,
  StatsBlock,
  MissionBlock,
  PropertiesBlock,
  PropertyCategoryBlock,
  PropertyListBlock,
  ServicesBlock,
  InfoCardsBlock,
  InteractiveMapBlock,
  VirtualTourBlock,
  AdvisorsBlock,
  TestimonialsBlock,
  KnowledgeBaseBlock,
  DualActionBlock,
  FounderSpotlightBlock,
  WelcomeBlock,
  WhoWeAreBlock,
  AboutUsHeroBlock,
  MapBlock,
  ContactSectionBlock,
  PrivacyPolicyBlock,
  CertificatesBlock,
  FrequentQuestionsBlock,
  BuyingGuideBlock,
  AfterSalesCareBlock,
  SellYourPropertyBlock,
  OwnersBlock,
  CharityBlock,
  OurTestimonialsBlock,
  AreaInfoBlock,
  AreaDetailBlock,
  BlogPostsBlock,
] as const satisfies readonly Block[]
