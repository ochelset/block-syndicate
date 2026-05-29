import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import type { Property } from '../game/gameTypes';
import styles from './GameMap.module.css';

interface GameMapProps {
  onBlockClick: (
    featureId: number | string,
    lat: number,
    lng: number,
    height?: number,
    area?: number,
    featureIds?: (number | string)[],
  ) => void;
  ownedProperties: Property[];
  selectedFeatureIds: (number | string)[];
}

type FeatureId = number | string;

function ringAreaM2(ring: number[][]): number {
  if (ring.length < 3) return 0;
  const cosLat = Math.cos((ring[0][1] * Math.PI) / 180);
  const latM = 110540;
  const lngM = 111320 * cosLat;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area +=
      ring[i][0] * lngM * ring[i + 1][1] * latM -
      ring[i + 1][0] * lngM * ring[i][1] * latM;
  }
  return Math.abs(area / 2);
}

function calcFootprintM2(
  geometry: mapboxgl.MapboxGeoJSONFeature['geometry'],
): number | undefined {
  if (geometry.type === 'Polygon') {
    return ringAreaM2(geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce(
      (sum, poly) => sum + ringAreaM2(poly[0]),
      0,
    );
  }
  return undefined;
}

// ~1 meter precision for coordinate matching
const COORD_PREC = 5;

function extractCoords(
  geometry: mapboxgl.MapboxGeoJSONFeature['geometry'],
): Set<string> {
  const coords = new Set<string>();
  const addRing = (ring: number[][]) => {
    for (const [x, y] of ring) {
      coords.add(`${x.toFixed(COORD_PREC)},${y.toFixed(COORD_PREC)}`);
    }
  };
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) addRing(ring);
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      for (const ring of poly) addRing(ring);
    }
  }
  return coords;
}

function findAdjacentGroup(
  primary: mapboxgl.MapboxGeoJSONFeature,
  candidates: mapboxgl.MapboxGeoJSONFeature[],
): mapboxgl.MapboxGeoJSONFeature[] {
  const groupCoords = extractCoords(primary.geometry);
  const result = [primary];
  // Deduplicate candidates and exclude primary
  const seen = new Set<FeatureId>([primary.id as FeatureId]);
  const pool = candidates.filter(
    f => f.id !== undefined && !seen.has(f.id as FeatureId) && seen.add(f.id as FeatureId),
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = pool.length - 1; i >= 0; i--) {
      const f = pool[i];
      const fCoords = extractCoords(f.geometry);
      let touches = false;
      for (const c of fCoords) {
        if (groupCoords.has(c)) {
          touches = true;
          break;
        }
      }
      if (touches) {
        result.push(f);
        for (const c of fCoords) groupCoords.add(c);
        pool.splice(i, 1);
        changed = true;
      }
    }
  }
  return result;
}

function applyHighlights(
  map: mapboxgl.Map,
  properties: Property[],
  highlighted: Map<string, FeatureId[]>,
) {
  if (!map.isStyleLoaded()) return;
  const currentIds = new Set(properties.map(p => p.id));

  for (const [propId, featureIds] of highlighted) {
    if (!currentIds.has(propId)) {
      for (const fid of featureIds) {
        map.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: fid },
          { owned: false },
        );
      }
      highlighted.delete(propId);
    }
  }

  for (const prop of properties) {
    if (highlighted.has(prop.id)) continue;
    const ids = prop.featureIds ?? [prop.featureId];
    for (const fid of ids) {
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id: fid },
        { owned: true },
      );
    }
    highlighted.set(prop.id, ids);
  }
}

export function GameMap({
  onBlockClick,
  ownedProperties,
  selectedFeatureIds,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onClickRef = useRef(onBlockClick);
  const ownedRef = useRef(ownedProperties);
  const highlightedRef = useRef<Map<string, FeatureId[]>>(new Map());
  const prevSelectedRef = useRef<FeatureId[]>([]);

  useEffect(() => {
    onClickRef.current = onBlockClick;
  }, [onBlockClick]);

  useEffect(() => {
    ownedRef.current = ownedProperties;
  }, [ownedProperties]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      center: [10.7522, 59.9139],
      zoom: 14,
      pitch: 55,
      bearing: -15,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
      map.addLayer({
        id: 'buildings-3d',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#00f3ff',
            ['boolean', ['feature-state', 'owned'], false],
            '#ff2a5f',
            '#1a2c40',
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13,
            0,
            13.5,
            ['get', 'height'],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13,
            0,
            13.5,
            ['get', 'min_height'],
          ],
          'fill-extrusion-opacity': 0.9,
        },
      });

      applyHighlights(map, ownedRef.current, highlightedRef.current);
    });

    // Re-apply after panning so newly-visible tiles get highlighted
    map.on('idle', () => {
      applyHighlights(map, ownedRef.current, highlightedRef.current);
    });

    map.on('click', e => {
      const primary = map.queryRenderedFeatures(e.point, {
        layers: ['buildings-3d'],
      })[0];
      if (!primary || primary.id === undefined) return;

      const RADIUS = 50;
      const candidates = map.queryRenderedFeatures(
        [
          [e.point.x - RADIUS, e.point.y - RADIUS],
          [e.point.x + RADIUS, e.point.y + RADIUS],
        ],
        { layers: ['buildings-3d'] },
      );

      const group = findAdjacentGroup(primary, candidates);
      const featureIds = group.map(f => f.id as FeatureId);

      const { lat, lng } = e.lngLat;
      const height = primary.properties?.height as number | undefined;
      const totalArea = group.reduce((sum, f) => {
        return sum + (calcFootprintM2(f.geometry) ?? 0);
      }, 0);

      onClickRef.current(
        primary.id as FeatureId,
        lat,
        lng,
        height,
        totalArea > 0 ? totalArea : undefined,
        featureIds.length > 1 ? featureIds : undefined,
      );
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      highlightedRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) applyHighlights(map, ownedProperties, highlightedRef.current);
  }, [ownedProperties]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    for (const id of prevSelectedRef.current) {
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id },
        { selected: false },
      );
    }
    for (const id of selectedFeatureIds) {
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id },
        { selected: true },
      );
    }
    prevSelectedRef.current = selectedFeatureIds;
  }, [selectedFeatureIds]);

  return <div ref={containerRef} className={styles.container} />;
}
