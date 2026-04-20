export type RegionCatalogEntry = {
  id: string
  name: string
  lat: number
  lng: number
}

export const REGION_CATALOG: RegionCatalogEntry[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', lat: 38.9, lng: -77.0 },
  { id: 'us-east-2', name: 'US East (Ohio)', lat: 39.96, lng: -83.0 },
  { id: 'us-west-1', name: 'US West (N. California)', lat: 37.35, lng: -121.96 },
  { id: 'us-west-2', name: 'US West (Oregon)', lat: 45.5, lng: -122.6 },
  { id: 'us-central-1', name: 'US Central', lat: 41.8, lng: -87.6 },
  { id: 'eu-west-1', name: 'Europe (Ireland)', lat: 53.3, lng: -6.3 },
  { id: 'eu-west-2', name: 'Europe (London)', lat: 51.5, lng: -0.12 },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', lat: 50.1, lng: 8.7 },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', lat: 1.35, lng: 103.8 },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', lat: 35.7, lng: 139.7 },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', lat: 19.07, lng: 72.88 },
]

