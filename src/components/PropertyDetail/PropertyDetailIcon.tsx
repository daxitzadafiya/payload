import {
  ArrowUpDown,
  ArrowUpRight,
  Bath,
  Bed,
  Building,
  Building2,
  CheckCircle2,
  CircleParking,
  Cloud,
  Cpu,
  DollarSign,
  DoorOpen,
  Dumbbell,
  Flame,
  Home,
  Landmark,
  Leaf,
  Microwave,
  Mountain,
  PanelTop,
  Phone,
  Route,
  Ruler,
  Sailboat,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  TreePine,
  Trees,
  Waves,
  Wifi,
  Wind,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import React from 'react'

const PROPERTY_DETAIL_ICONS: Record<string, LucideIcon> = {
  // Spec bar
  straighten: Ruler,
  ruler: Ruler,
  bed: Bed,
  bathtub: Bath,
  bath: Bath,
  villa: Home,
  home: Home,

  // Pool & water
  pool: Waves,
  pool_private: Waves,
  infinity_pool: Waves,
  pool_heated: Waves,
  childrens_pool: Waves,
  plunge_pool: Waves,
  hot_tub: Waves,
  whirlpool: Waves,

  // Outdoor & views
  garden: Trees,
  park: Trees,
  sea: Sailboat,
  beach: Sailboat,
  sailing: Sailboat,
  panoramic: Mountain,
  mountain: Mountain,
  terrain: Mountain,
  golf: Landmark,
  lake: Waves,
  forest: TreePine,

  // Building features
  lift_elevator: ArrowUpDown,
  elevator: ArrowUpDown,
  balcony: DoorOpen,
  basement: Building2,
  foundation: Building2,
  private_terrace: DoorOpen,
  deck: DoorOpen,
  roof_terrace: DoorOpen,
  covered_terrace: DoorOpen,
  attic: Building2,
  storage_room: Building2,
  utility_room: Building2,
  guest_apartment: Home,
  guest_house: Home,
  holiday_village: Home,

  // Comfort & utilities
  fireplace: Flame,
  heat: Wind,
  underfloor_heating: Wind,
  air_conditioning: Wind,
  central_heating: Wind,
  double_glazing: PanelTop,
  window: PanelTop,
  blinds_closed: PanelTop,
  electric_curtains: PanelTop,
  domotics: Smartphone,
  smart_toy: Smartphone,
  router: Wifi,
  wifi: Wifi,
  bolt: Cpu,
  electricity: Cpu,

  // Rooms & fittings
  fitted_wardrobes: DoorOpen,
  built_in_cabinets: Microwave,
  kitchen: Microwave,
  en_suite_bathroom: Bath,
  meeting_room: Bath,
  dining_room: Home,
  study_room: Home,
  office_room: Home,

  // Lifestyle
  wine_bar: Wine,
  fitness_center: Dumbbell,
  security: Shield,
  local_parking: CircleParking,
  parking: CircleParking,
  sunny: Sun,
  solarium: Sun,

  // Contact / misc
  phone_in_talk: Phone,
  phone: Phone,
  check_circle: CheckCircle2,

  // Energy
  energy_savings_leaf: Leaf,
  co2: Cloud,
  open_in_new: ArrowUpRight,

  //extra
  street : Route,
  price : DollarSign,
  urban : Building,
  sauna : Sparkles
}

type Props = {
  name: string
  className?: string
  size?: number
  strokeWidth?: number
}

export const PropertyDetailIcon: React.FC<Props> = ({
  name,
  className,
  size = 24,
  strokeWidth = 1.75,
}) => {
  const Icon = PROPERTY_DETAIL_ICONS[name] ?? CheckCircle2
  return <Icon className={className} size={size} strokeWidth={strokeWidth} />
}
