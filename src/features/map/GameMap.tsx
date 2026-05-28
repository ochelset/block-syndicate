import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef } from 'react';
import type { Property } from '../game/gameTypes';
import styles from './GameMap.module.css';

interface GameMapProps {
  onBlockClick: (lat: number, lng: number) => void;
  ownedProperties: Property[];
}

export function GameMap({ onBlockClick, ownedProperties }: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onClickRef = useRef(onBlockClick);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    onClickRef.current = onBlockClick;
  }, [onBlockClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      center: [10.7522, 59.9139],
      zoom: 14,
    });

    map.on('click', e => {
      onClickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    map.on('mouseenter', 'building', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'building', () => {
      map.getCanvas().style.cursor = 'grab';
    });

    mapRef.current = map;

    return () => {
      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(ownedProperties.map(p => p.id));

    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const prop of ownedProperties) {
      if (markersRef.current.has(prop.id)) continue;

      const el = document.createElement('div');
      Object.assign(el.style, {
        width: '14px',
        height: '14px',
        background: 'var(--crimson-500)',
        border: '2px solid var(--cyan-400)',
        borderRadius: '50%',
        boxShadow: '0 0 6px var(--crimson-500), 0 0 12px rgba(255,42,95,0.4)',
        pointerEvents: 'none',
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([prop.lng, prop.lat])
        .addTo(map);

      markersRef.current.set(prop.id, marker);
    }
  }, [ownedProperties]);

  return <div ref={containerRef} className={styles.container} />;
}
