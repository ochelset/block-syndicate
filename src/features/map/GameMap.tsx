import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import type { Property } from '../game/gameTypes';
import styles from './GameMap.module.css';

interface GameMapProps {
  onBlockClick: (featureId: number | string, lat: number, lng: number) => void;
  ownedProperties: Property[];
}

type FeatureId = number | string;

function applyHighlights(
  map: mapboxgl.Map,
  properties: Property[],
  highlighted: Map<string, FeatureId>,
) {
  if (!map.isStyleLoaded()) return;
  const currentIds = new Set(properties.map(p => p.id));

  for (const [propId, featureId] of highlighted) {
    if (!currentIds.has(propId)) {
      map.setFeatureState(
        { source: 'composite', sourceLayer: 'building', id: featureId },
        { owned: false },
      );
      highlighted.delete(propId);
    }
  }

  for (const prop of properties) {
    if (highlighted.has(prop.id)) continue;
    map.setFeatureState(
      { source: 'composite', sourceLayer: 'building', id: prop.featureId },
      { owned: true },
    );
    highlighted.set(prop.id, prop.featureId);
  }
}

export function GameMap({ onBlockClick, ownedProperties }: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onClickRef = useRef(onBlockClick);
  const ownedRef = useRef(ownedProperties);
  const highlightedRef = useRef<Map<string, FeatureId>>(new Map());

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
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['buildings-3d'],
      });
      if (features.length === 0 || features[0].id === undefined) return;

      const featureId = features[0].id as FeatureId;
      const { lat, lng } = e.lngLat;
      onClickRef.current(featureId, lat, lng);
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

  return <div ref={containerRef} className={styles.container} />;
}
