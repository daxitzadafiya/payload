const IPAPI_URL = 'https://ipapi.co/json/'

type IpApiResponse = {
  country_code?: string
}

function isValidCountryCode(code: string): boolean {
  return /^[a-z]{2}$/.test(code)
}

/** Same ipapi.co lookup used in virtual-chatbot-FE PhoneNumberInput. */
export async function fetchCountryFromIpApi(): Promise<string | null> {
  const response = await fetch(IPAPI_URL)
  if (!response.ok) return null

  const data = (await response.json()) as IpApiResponse
  const countryCode = data.country_code?.trim().toLowerCase()

  if (!countryCode || !isValidCountryCode(countryCode)) return null

  return countryCode
}
