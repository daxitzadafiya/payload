export type PublicWeather = {
  locationName: string
  country: string
  temperatureC: number
  conditionText: string
  conditionIcon: string
  cachedAt: string
  refreshIntervalMinutes: number
}

export type WeatherApiResponse = {
  location?: {
    name?: string
    country?: string
  }
  current?: {
    temp_c?: number
    condition?: {
      text?: string
      icon?: string
    }
  }
}
