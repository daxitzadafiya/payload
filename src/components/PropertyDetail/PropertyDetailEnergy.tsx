'use client'

import React from 'react'

import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'
import {
  ENERGY_GRADE_STYLES,
  ENERGY_GRADES,
  ENERGY_NOT_AVAILABLE_LABEL,
  ENERGY_PENDING_LABEL,
  type CRMPropertyEnergy,
  type EnergyGrade,
  type EnergyGradeStyle,
} from '@/utilities/crmPropertyEnergy'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  energy: CRMPropertyEnergy
}

const formatMetric = (value: number | string | undefined): string | undefined => {
  if (value == null || value === '') return undefined
  return String(value)
}

type EnergyGradeBarProps = {
  grade: EnergyGrade
  style: EnergyGradeStyle
  isActive: boolean
}

const EPC_BAR_CLIP = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'

/** European EPC-style bar: coloured shaft + arrow tip, widening A → G. */
const EnergyGradeBar: React.FC<EnergyGradeBarProps> = ({ grade, style, isActive }) => {
  const barWidth = isActive ? style.widthPercent + 4 : style.widthPercent

  return (
    <div
      className={`flex items-center ${isActive ? 'h-11 py-0.5' : 'h-9 opacity-60 saturate-[0.35]'}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <div
        className={`relative flex items-center pl-3 font-bold ${
          isActive
            ? 'epc-active-bar h-10 min-w-11 text-base shadow-md brightness-110 saturate-150'
            : 'h-9 min-w-11 text-sm'
        }`}
        style={{
          width: `${barWidth}%`,
          backgroundColor: style.color,
          color: style.textColor,
          clipPath: EPC_BAR_CLIP,
        }}
      >
        {grade}
      </div>

      {isActive && (
        <span
          className="epc-active-pointer ml-1.5 block h-0 w-0 border-y-[9px] border-y-transparent border-l-[11px] border-l-secondary"
          aria-hidden
        />
      )}
    </div>
  )
}

export const PropertyDetailEnergy: React.FC<Props> = ({ energy }) => {
  const heading = useTranslation('propertyDetail.energy.heading', 'Energy Efficiency')
  const pendingLabel = useTranslation('propertyDetail.energy.pending', ENERGY_PENDING_LABEL)
  const notAvailableLabel = useTranslation(
    'propertyDetail.energy.notAvailable',
    ENERGY_NOT_AVAILABLE_LABEL,
  )
  const ratingScaleLabel = useTranslation(
    'propertyDetail.energy.ratingScale',
    'Energy Rating Scale',
  )
  const energyConsumptionNote = useTranslation(
    'propertyDetail.energy.energyConsumptionNote',
    'Energy consumption',
  )
  const emissionsNote = useTranslation('propertyDetail.energy.emissionsNote', 'Emissions')
  const statusLabel = useTranslation('propertyDetail.energy.status', 'Status:')
  const classPrefix = useTranslation('propertyDetail.energy.classPrefix', 'Class')
  const consumptionLabel = useTranslation('propertyDetail.energy.consumption', 'Consumption')
  const emissionsLabel = useTranslation('propertyDetail.energy.emissions', 'Emissions')
  const annualEnergyLabel = useTranslation('propertyDetail.energy.annualEnergy', 'Annual Energy')
  const co2FootprintLabel = useTranslation('propertyDetail.energy.co2Footprint', 'CO2 Footprint')

  const consumption = formatMetric(energy.consumption)
  const emissions = formatMetric(energy.emissions)
  const emptyStatusRaw = energy.statusMessage || energy.certificate
  const emptyStatusDisplay =
    emptyStatusRaw === ENERGY_PENDING_LABEL
      ? pendingLabel
      : emptyStatusRaw === ENERGY_NOT_AVAILABLE_LABEL
        ? notAvailableLabel
        : emptyStatusRaw || pendingLabel

  return (
    <div className="mt-20 border-t border-secondary/20 pt-12 md:mt-24">
      <div className="mb-10 md:mb-12">
        <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
        <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
          {heading}
        </h2>
      </div>

      <div className="rounded-[1.5rem] border border-secondary/25 bg-surface-cream p-6 md:rounded-[1.75rem] md:p-8">
        {energy.isEmpty ? (
          <div className="py-10 text-center">
            <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-on-surface-variant">
              {emptyStatusDisplay}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5">
              <p className="mb-5 text-[10px] font-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
                {ratingScaleLabel}
              </p>

              <div className="w-full max-w-sm space-y-1">
                {ENERGY_GRADES.map((grade) => (
                  <EnergyGradeBar
                    key={grade}
                    grade={grade}
                    style={ENERGY_GRADE_STYLES[grade]}
                    isActive={energy.activeGrade === grade}
                  />
                ))}
              </div>

              <p className="mt-5 text-[10px] uppercase leading-relaxed tracking-widest text-on-surface-variant">
                {energyConsumptionNote} kWh/m² year | {emissionsNote} kg CO2/m² year
              </p>
            </div>

            <div className="flex flex-col items-center justify-center text-center lg:col-span-3 lg:items-start lg:text-left">
              {energy.activeGrade && (
                <div className="epc-status-reveal mb-8">
                  <p className="text-label-sm font-label-sm uppercase tracking-widest text-on-surface-variant">
                    {statusLabel}
                  </p>
                  <p className="mt-1 font-headline-lg text-[40px] font-light leading-none text-secondary md:text-[48px]">
                    {classPrefix} {energy.displayGrade ?? energy.activeGrade}
                  </p>
                </div>
              )}

              {(consumption != null || emissions != null) && (
                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {consumption != null && (
                      <div className="min-w-0">
                        <p className="mb-2 border-b border-outline-variant/30 pb-2 text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
                          {consumptionLabel}
                        </p>
                        <div className="flex min-h-[4.5rem] items-center justify-center rounded-lg bg-primary px-3 py-2">
                          <span
                            className={`font-semibold leading-none tabular-nums text-on-primary text-xl`}
                          >
                            {consumption}
                          </span>
                        </div>
                      </div>
                    )}
                    {emissions != null && (
                      <div className="min-w-0">
                        <p className="mb-2 border-b border-outline-variant/30 pb-2 text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
                          {emissionsLabel}
                        </p>
                        <div className="flex min-h-[4.5rem] items-center justify-center rounded-lg bg-primary px-3 py-2">
                          <span
                            className={`font-semibold leading-none tabular-nums text-on-primary text-xl`}
                          >
                            {emissions}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-10 lg:col-span-4 lg:border-l lg:border-secondary/20 lg:pl-8">
              {consumption != null && (
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                    <PropertyDetailIcon
                      name="energy_savings_leaf"
                      className="text-secondary"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-label-sm font-label-sm uppercase text-on-surface-variant">
                      {annualEnergyLabel}
                    </p>
                    <p className="text-headline-sm font-headline-sm font-light text-primary">
                      {consumption} <span className="text-xs">kWh/m²</span>
                    </p>
                  </div>
                </div>
              )}

              {emissions != null && (
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15">
                    <PropertyDetailIcon name="co2" className="text-secondary" size={20} />
                  </div>
                  <div>
                    <p className="text-label-sm font-label-sm uppercase text-on-surface-variant">
                      {co2FootprintLabel}
                    </p>
                    <p className="text-headline-sm font-headline-sm font-light text-primary">
                      {emissions} <span className="text-xs">kg/m²</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
