const BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

interface GeocodingFeature {
  place_type: string[];
  text: string;
  address?: string;
  place_name?: string;
  properties?: {
    category?: string;
    address?: string;
  };
}

interface GeocodingResponse {
  features: GeocodingFeature[];
}

export interface PoiInfo {
  name: string;
  category?: string;
  address?: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  token: string,
): Promise<PoiInfo | null> {
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
  if (poi) {
    const info: PoiInfo = { name: poi.text };
    if (poi.properties?.category) info.category = poi.properties.category;
    if (poi.properties?.address) {
      info.address = poi.properties.address;
    } else if (poi.place_name) {
      const stripped = poi.place_name.replace(`${poi.text}, `, '');
      if (stripped !== poi.place_name) info.address = stripped;
    }
    return info;
  }

  const addr = features.find(f => f.place_type.includes('address'));
  if (addr) {
    return { name: addr.address ? `${addr.text} ${addr.address}` : addr.text };
  }

  return { name: features[0].text };
}
