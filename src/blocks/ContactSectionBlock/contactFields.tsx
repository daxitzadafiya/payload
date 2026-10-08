'use client'

import type {
  CheckboxField,
  CountryField,
  SelectField,
} from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldErrorsImpl } from 'react-hook-form'
import type { UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { AlertCircle, Globe, Mail, MessageSquare, Tag, User } from 'lucide-react'
import React from 'react'
import { PhoneInputField } from '@/components/PhoneInput/PhoneInputField'
import { Checkbox as CheckboxUi } from '@/components/ui/checkbox'
import { cn } from '@/utilities/ui'
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { countryOptions } from '@/blocks/Form/Country/options'
import { CMSLink } from '@/components/Link'
import { buildPhoneValidationRules } from '@/utilities/phoneValidationRules'
import {
  useFormFieldInvalidEmailMessage,
  useFormFieldInvalidPhoneMessage,
  useFormFieldLabel,
  useFormFieldRequiredMessage,
  useTranslation,
} from '@/utilities/translateClient'

import './contact-fields.css'

const inputClassName =
  'w-full rounded-xl border border-outline-variant/35 bg-white pl-10 pr-4 py-3.5 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-tertiary focus-visible:ring-4 focus-visible:ring-tertiary/20'

/** Same invalid border as PhoneInput contact variant (`var(--color-error)`). */
const inputInvalidClassName = 'contact-field--invalid'

const selectTriggerClassName =
  'w-full rounded-xl border bg-white border-outline-variant/35 pl-10 pr-4 py-3.5 h-auto min-h-[52px] focus-visible:ring-4 focus-visible:ring-tertiary/20'

const labelClassName =
  'mb-2 block font-label-sm text-label-sm uppercase tracking-[0.18em] text-tertiary'

const iconClassName =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant'

const textareaIconClassName = 'pointer-events-none absolute left-3 top-4 text-on-surface-variant'

function hasFieldError(errors: Partial<FieldErrorsImpl> | undefined, name: string): boolean {
  return Boolean(errors?.[name])
}

type BaseFieldProps = {
  name: string
  /** Unique id when more than one copy of the form is on the page. */
  domId?: string
  label?: string
  required?: boolean
  errors: any
  register: UseFormRegister<any>
  defaultValue?: string
}

function resolveDomId(name: string, domId?: string): string {
  return domId?.trim() || name
}

type PhoneFieldProps = BaseFieldProps & {
  control: Control
}

function fieldHint(name: string, label?: string): string {
  return `${name} ${label ?? ''}`.toLowerCase()
}

function isPhoneField(name: string, label?: string): boolean {
  return /phone|mobile|tel|cell|cellphone/.test(fieldHint(name, label))
}

function ContactPhoneField({
  name,
  domId,
  label,
  required,
  errors,
  control,
  defaultValue,
}: PhoneFieldProps) {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalidPhoneMessage = useFormFieldInvalidPhoneMessage(name)
  const inputId = resolveDomId(name, domId)

  return (
    <div>
      {translatedLabel && (
        <label className={labelClassName} htmlFor={inputId}>
          {translatedLabel}
          {required && ' *'}
        </label>
      )}
      <Controller
        control={control}
        defaultValue={defaultValue ?? ''}
        name={name}
        rules={buildPhoneValidationRules({
          required,
          requiredMessage,
          invalidPhoneMessage,
        })}
        render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
          <>
            <PhoneInputField
              id={inputId}
              invalid={Boolean(error)}
              name={name}
              placeholder={translatedLabel}
              showValidation={Boolean(error)}
              value={value}
              variant="contact"
              onBlur={onBlur}
              onChange={onChange}
            />
            {error?.message && (
              <div className="contact-field-error mt-2 text-sm">{String(error.message)}</div>
            )}
          </>
        )}
      />
    </div>
  )
}

function ContactFieldError({ message }: { message?: string }) {
  if (!message) return null
  return <div className="contact-field-error mt-2 text-sm">{message}</div>
}

function ContactFieldWrapper({
  name,
  domId,
  label,
  required,
  errors,
  icon,
  textareaIcon,
  children,
}: BaseFieldProps & { children: React.ReactNode; icon?: React.ReactNode; textareaIcon?: boolean }) {
  const message = errors[name]?.message as string | undefined
  const inputId = resolveDomId(name, domId)

  return (
    <div>
      {label && (
        <label className={labelClassName} htmlFor={inputId}>
          {label}
          {required && ' *'}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className={textareaIcon ? textareaIconClassName : iconClassName}>{icon}</span>
        )}
        {children}
      </div>
      {errors[name] && <ContactFieldError message={message} />}
    </div>
  )
}

export const ContactTextField: React.FC<
  BaseFieldProps & { control?: Control }
> = ({
  name,
  domId,
  label,
  required,
  errors,
  register,
  control,
  defaultValue,
}) => {
  const phoneField = isPhoneField(name, label)

  if (phoneField && control) {
    return (
      <ContactPhoneField
        control={control}
        defaultValue={defaultValue}
        domId={domId}
        errors={errors}
        label={label}
        name={name}
        register={register}
        required={required}
      />
    )
  }

  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalid = hasFieldError(errors, name)

  return (
    <ContactFieldWrapper
      domId={domId}
      errors={errors}
      icon={<User size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
    >
      <input
        aria-invalid={invalid}
        className={cn(inputClassName, invalid && inputInvalidClassName)}
        defaultValue={defaultValue}
        id={resolveDomId(name, domId)}
        placeholder={translatedLabel}
        type="text"
        {...register(name, { required: required ? requiredMessage : false })}
      />
    </ContactFieldWrapper>
  )
}

export const ContactEmailField: React.FC<BaseFieldProps> = ({
  name,
  domId,
  label,
  required,
  errors,
  register,
  defaultValue,
}) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalidEmailMessage = useFormFieldInvalidEmailMessage(name)
  const invalid = hasFieldError(errors, name)

  return (
    <ContactFieldWrapper
      domId={domId}
      errors={errors}
      icon={<Mail size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
    >
      <input
        aria-invalid={invalid}
        className={cn(inputClassName, invalid && inputInvalidClassName)}
        defaultValue={defaultValue}
        id={resolveDomId(name, domId)}
        placeholder={translatedLabel}
        type="email"
        {...register(name, {
          pattern: {
            value: /^\S[^\s@]*@\S+$/,
            message: invalidEmailMessage,
          },
          required: required ? requiredMessage : false,
        })}
      />
    </ContactFieldWrapper>
  )
}

export const ContactNumberField: React.FC<PhoneFieldProps> = (props) => (
  <ContactPhoneField {...props} />
)

export const ContactTextareaField: React.FC<BaseFieldProps & { rows?: number }> = ({
  name,
  domId,
  label,
  required,
  errors,
  register,
  defaultValue,
  rows = 4,
}) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalid = hasFieldError(errors, name)

  return (
    <ContactFieldWrapper
      domId={domId}
      errors={errors}
      icon={<MessageSquare size={18} strokeWidth={2} />}
      label={translatedLabel}
      name={name}
      register={register}
      required={required}
      textareaIcon
    >
      <textarea
        aria-invalid={invalid}
        className={cn(inputClassName, invalid && inputInvalidClassName)}
        defaultValue={defaultValue}
        id={resolveDomId(name, domId)}
        placeholder={translatedLabel}
        rows={rows}
        {...register(name, { required: required ? requiredMessage : false })}
      />
    </ContactFieldWrapper>
  )
}

const PRIVACY_POLICY_VALIDATION_KEY = 'form.validation.privacyPolicy.required'
const PRIVACY_POLICY_VALIDATION_FALLBACK =
  'You must accept the Privacy Policy to continue.'

const checkboxClassName =
  'mt-0.5 size-5 shrink-0 rounded-md border-outline-variant/50 shadow-none data-[state=checked]:border-tertiary data-[state=checked]:bg-tertiary data-[state=checked]:text-white focus-visible:ring-4 focus-visible:ring-tertiary/20'

function renderCheckboxLabel(label: string, required?: boolean) {
  const parts = label.split(/(Privacy Policy)/i)

  return (
    <span className="font-body-md text-body-md leading-relaxed text-on-surface">
      {required && <span className="mr-1 text-tertiary">*</span>}
      {parts.map((part, index) =>
        /^Privacy Policy$/i.test(part) ? (
          <CMSLink
            className="font-medium text-tertiary decoration-tertiary/40 underline-offset-2 cursor-pointer hover:text-tertiary/80"
            key={index}
            appearance="inline"
            newTab={true}
            type="custom"
            url="/privacy"
            label={part}
          />
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </span>
  )
}

export const ContactCheckboxField: React.FC<
  CheckboxField & {
    control: Control
    domId?: string
    errors: Partial<FieldErrorsImpl>
    register: UseFormRegister<any>
  }
> = ({ name, domId, label, required, control, errors, defaultValue }) => {
  const translatedLabel = useFormFieldLabel(name, label)
  const acceptanceError = useTranslation(
    PRIVACY_POLICY_VALIDATION_KEY,
    PRIVACY_POLICY_VALIDATION_FALLBACK,
  )
  const invalid = hasFieldError(errors, name)
  const inputId = resolveDomId(name, domId)

  return (
    <div>
      <Controller
        control={control}
        defaultValue={defaultValue ?? false}
        name={name}
        rules={{
          validate: (value) => value === true || acceptanceError,
        }}
        render={({ field: { onChange, value } }) => (
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors border-outline-variant/35 hover:border-tertiary/40 has-focus-visible:border-tertiary has-focus-visible:ring-4 has-focus-visible:ring-tertiary/20',
              invalid && 'contact-field-checkbox--invalid',
            )}
            htmlFor={inputId}
          >
            <CheckboxUi
              aria-invalid={invalid}
              checked={Boolean(value)}
              className={checkboxClassName}
              id={inputId}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            {translatedLabel ? renderCheckboxLabel(translatedLabel, required) : null}
          </label>
        )}
      />
      {invalid && (
        <p className="contact-field-error mt-2 flex items-center gap-1.5 font-body-sm text-body-sm">
          <AlertCircle className="shrink-0" size={16} strokeWidth={2} aria-hidden />
          <span>{(errors[name]?.message as string) || acceptanceError}</span>
        </p>
      )}
    </div>
  )
}

export const contactFields = {
  text: ContactTextField,
  email: ContactEmailField,
  number: ContactNumberField,
  textarea: ContactTextareaField,
  select: ContactSelectField,
  country: ContactCountryField,
  checkbox: ContactCheckboxField,
}

function ContactSelectField(
  props: SelectField & { control: Control; errors: Partial<FieldErrorsImpl> },
) {
  const { name, control, errors, label, options, required, defaultValue, domId } = props as typeof props & {
    domId?: string
  }
  const inputId = resolveDomId(name, domId)
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalid = hasFieldError(errors, name)

  return (
    <div>
      {translatedLabel && (
        <label className={labelClassName} htmlFor={inputId}>
          {translatedLabel}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue={defaultValue ?? ''}
        name={name}
        rules={{ required: required ? requiredMessage : false }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = options.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                aria-invalid={invalid}
                className={cn(selectTriggerClassName, invalid && inputInvalidClassName)}
                id={inputId}
              >
                <Tag className={iconClassName} size={18} strokeWidth={2} />
                <SelectValue placeholder={translatedLabel} />
              </SelectTrigger>
              <SelectContent>
                {options.map(({ label: optionLabel, value: optionValue }) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectComponent>
          )
        }}
      />
      {invalid && <ContactFieldError message={errors[name]?.message as string | undefined} />}
    </div>
  )
}

function ContactCountryField(
  props: CountryField & { control: Control; errors: Partial<FieldErrorsImpl> },
) {
  const { name, control, errors, label, required, domId } = props as typeof props & {
    domId?: string
  }
  const inputId = resolveDomId(name, domId)
  const translatedLabel = useFormFieldLabel(name, label)
  const requiredMessage = useFormFieldRequiredMessage(name, label)
  const invalid = hasFieldError(errors, name)

  return (
    <div>
      {translatedLabel && (
        <label className={labelClassName} htmlFor={inputId}>
          {translatedLabel}
          {required ? ' *' : ''}
        </label>
      )}
      <Controller
        control={control}
        defaultValue=""
        name={name}
        rules={{ required: required ? requiredMessage : false }}
        render={({ field: { onChange, value } }) => {
          const controlledValue = countryOptions.find((t) => t.value === value)

          return (
            <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
              <SelectTrigger
                aria-invalid={invalid}
                className={cn(selectTriggerClassName, invalid && inputInvalidClassName)}
                id={inputId}
              >
                <Globe className={iconClassName} size={18} strokeWidth={2} />
                <SelectValue placeholder={translatedLabel} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map(({ label: optionLabel, value: optionValue }) => (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectComponent>
          )
        }}
      />
      {invalid && <ContactFieldError message={errors[name]?.message as string | undefined} />}
    </div>
  )
}
