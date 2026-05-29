const BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface GeocodingFeature {
  place_type: string[];
  text: string;
  address?: string;
}

interface GeocodingResponse {
  features: GeocodingFeature[];
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  token: string,
): Promise<string | null> {
  const url = `${BASE}/${lng},${lat}.json?types=poi,address&language=no&access_token=${token}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data: GeocodingResponse = await res.json();
  const features = data.features ?? [];
  if (features.length === 0) return null;

  const poi = features.find(f => f.place_type.includes('poi'));
  if (poi) return poi.text;

  const addr = features.find(f => f.place_type.includes('address'));
  if (addr) return addr.address ? `${addr.text} ${addr.address}` : addr.text;

  return features[0].text;
}
