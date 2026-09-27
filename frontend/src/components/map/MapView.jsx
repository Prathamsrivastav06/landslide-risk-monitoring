import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import MapSearchBar from './MapSearchBar';
import { Layers, Compass, Eye, RotateCcw } from 'lucide-react';

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satellite: {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    },
    layers: [{ id: 'satellite-layer', type: 'raster', source: 'satellite-tiles' }]
  },
  topo: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [{
      id: 'osm',
      type: 'raster',
      source: 'osm-tiles',
      paint: { 'raster-brightness-min': 0, 'raster-brightness-max': 0.65, 'raster-saturation': -0.4 }
    }]
  }
};

export default function MapView({ onMapClick, onMapLoad, selectedLocation, landslides, riskPrediction, activeLayers }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeStyleKey, setActiveStyleKey] = useState('dark');
  const [is3D, setIs3D] = useState(false);
  
  const NER_CENTER = [93.0, 25.5];
  const NER_BOUNDS = [[88.0, 20.0], [98.0, 30.0]];
  
  // Initialize Map
  useEffect(() => {
    if (map.current) return;
    
    const initMap = (styleConfig) => {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: styleConfig,
        center: NER_CENTER,
        zoom: 6.2,
        minZoom: 4,
        maxZoom: 16,
        pitch: 0,
        attributionControl: false
      });
      
      map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
      
      map.current.on('load', () => {
        setMapReady(true);
        addNERBoundary();
        if (onMapLoad) onMapLoad(map.current);
      });
      
      map.current.on('click', (e) => {
        const { lat, lng } = e.lngLat;
        if (onMapClick) onMapClick(lat, lng);
      });
      
      map.current.getCanvas().style.cursor = 'crosshair';
    };
    
    fetch(MAP_STYLES.dark)
      .then(() => initMap(MAP_STYLES.dark))
      .catch(() => initMap(MAP_STYLES.topo));
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Change basemap style
  const switchStyle = (key) => {
    if (!map.current || key === activeStyleKey) return;
    setActiveStyleKey(key);
    map.current.setStyle(MAP_STYLES[key]);
    map.current.once('style.load', () => {
      addNERBoundary();
    });
  };

  // Toggle 3D Terrain Pitch
  const toggle3D = () => {
    if (!map.current) return;
    if (is3D) {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setIs3D(false);
    } else {
      map.current.easeTo({ pitch: 50, bearing: -15, duration: 1200 });
      setIs3D(true);
    }
  };

  // NER Boundary Layer
  const addNERBoundary = () => {
    if (!map.current) return;
    if (map.current.getSource('ner-region')) return;

    map.current.addSource('ner-region', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [88.0, 22.0], [98.0, 22.0], [98.0, 29.5],
            [88.0, 29.5], [88.0, 22.0]
          ]]
        }
      }
    });

    map.current.addLayer({
      id: 'ner-region-fill',
      type: 'fill',
      source: 'ner-region',
      paint: {
        'fill-color': '#00f0ff',
        'fill-opacity': 0.02
      }
    });

    map.current.addLayer({
      id: 'ner-region-line',
      type: 'line',
      source: 'ner-region',
      paint: {
        'line-color': '#00f0ff',
        'line-width': 1.5,
        'line-opacity': 0.4,
        'line-dasharray': [4, 4]
      }
    });
  };
  
  // Historical Landslides Clusters & Points
  useEffect(() => {
    if (!mapReady || !map.current || !landslides || !activeLayers?.historicalLandslides) {
      if (mapReady && map.current && map.current.getLayer('landslide-clusters')) {
        map.current.setLayoutProperty('landslide-clusters', 'visibility', 'none');
        map.current.setLayoutProperty('landslide-cluster-count', 'visibility', 'none');
        map.current.setLayoutProperty('landslide-points', 'visibility', 'none');
      }
      return;
    }
    
    const geojson = {
      type: 'FeatureCollection',
      features: landslides.map(ls => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(ls.longitude), parseFloat(ls.latitude)] },
        properties: {
          id: ls.id,
          source: ls.source || 'ISRO/GSI',
          year: ls.year || 2022,
          state: ls.state || 'NER',
          district: ls.district || 'Hill Division',
          landslide_type: ls.landslide_type || 'Debris Slide',
          trigger: ls.trigger_type || 'Monsoon Precipitation'
        }
      }))
    };
    
    if (map.current.getSource('landslides')) {
      map.current.getSource('landslides').setData(geojson);
      map.current.setLayoutProperty('landslide-clusters', 'visibility', 'visible');
      map.current.setLayoutProperty('landslide-cluster-count', 'visibility', 'visible');
      map.current.setLayoutProperty('landslide-points', 'visibility', 'visible');
    } else {
      map.current.addSource('landslides', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 40
      });
      
      map.current.addLayer({
        id: 'landslide-clusters',
        type: 'circle',
        source: 'landslides',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#f59e0b', 5,
            '#f97316', 15,
            '#ef4444', 30,
            '#dc2626'
          ],
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 30, 26],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.4)'
        }
      });
      
      map.current.addLayer({
        id: 'landslide-cluster-count',
        type: 'symbol',
        source: 'landslides',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Regular'],
          'text-size': 11
        },
        paint: { 'text-color': '#ffffff' }
      });
      
      map.current.addLayer({
        id: 'landslide-points',
        type: 'circle',
        source: 'landslides',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#f97316',
          'circle-radius': 6,
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Popup on click
      map.current.on('click', 'landslide-points', (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates.slice();
        
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(coords)
          .setHTML(`
            <div class="space-y-1 text-xs">
              <div class="flex items-center gap-1.5 text-orange-400 font-bold uppercase tracking-wider text-[10px]">
                <span>⚠ ${props.landslide_type}</span>
              </div>
              <div class="text-white font-semibold">${props.district}, ${props.state}</div>
              <div class="text-slate-400 text-[10px]">Year: <span class="text-slate-200">${props.year}</span> · Trigger: <span class="text-slate-200">${props.trigger}</span></div>
              <div class="text-[9px] font-mono text-cyan-400 pt-1 border-t border-white/10">Source: ${props.source}</div>
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'landslide-points', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'landslide-points', () => {
        map.current.getCanvas().style.cursor = 'crosshair';
      });
    }
  }, [mapReady, landslides, activeLayers]);
  
  // Selected Location High-Tech Animated Marker
  const markerRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !map.current) return;
    
    if (markerRef.current) {
      try { markerRef.current.remove(); } catch (e) {}
      markerRef.current = null;
    }
    
    const lat = parseFloat(selectedLocation?.lat);
    const lon = parseFloat(selectedLocation?.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      try {
        const el = document.createElement('div');
        el.id = 'selected-marker';
        el.className = 'relative flex items-center justify-center';
        el.innerHTML = `
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/40 radar-ping"></div>
          <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_#00f0ff]"></div>
        `;
        
        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(map.current);
        
        map.current.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.current.getZoom(), 9.5),
          duration: 1200,
          essential: true
        });
      } catch (err) {
        console.warn('Marker animation warning:', err);
      }
    }
  }, [mapReady, selectedLocation]);
  
  // Risk Zone Halo
  useEffect(() => {
    if (!mapReady || !map.current || !selectedLocation) return;
    
    const lat = parseFloat(selectedLocation.lat);
    const lon = parseFloat(selectedLocation.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    try {
      const riskColors = { LOW: '#10b981', MODERATE: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
      const color = riskColors[riskPrediction?.risk_class] || '#00f0ff';
      
      const geojson = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: { risk_class: riskPrediction?.risk_class || 'CALCULATED' }
      };
      
      const source = map.current.getSource('risk-zone');
      if (source) {
        source.setData(geojson);
        if (map.current.getLayer('risk-zone-circle')) {
          map.current.setPaintProperty('risk-zone-circle', 'circle-color', color);
          map.current.setPaintProperty('risk-zone-circle', 'circle-stroke-color', color);
        }
      } else {
        map.current.addSource('risk-zone', { type: 'geojson', data: geojson });
        map.current.addLayer({
          id: 'risk-zone-circle',
          type: 'circle',
          source: 'risk-zone',
          paint: {
            'circle-color': color,
            'circle-radius': 35,
            'circle-opacity': 0.25,
            'circle-stroke-width': 2,
            'circle-stroke-color': color,
            'circle-stroke-opacity': 0.7
          }
        });
      }
    } catch (err) {
      console.warn('MapLibre risk halo warning:', err);
    }
  }, [mapReady, riskPrediction, selectedLocation]);
  
  const focusNER = () => {
    if (map.current) {
      map.current.fitBounds(NER_BOUNDS, { padding: 40, duration: 1400 });
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setIs3D(false);
    }
  };
  
  return (
    <div className="relative w-full h-full bg-[#070b14]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Search bar */}
      <MapSearchBar onLocationSelect={(lat, lon, label) => {
        if (onMapClick) onMapClick(lat, lon, label);
      }} />
      
      {/* Top Left Navigation Action Pill */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <button
          onClick={focusNER}
          className="glass-panel px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 rounded-md transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] flex items-center gap-1.5 cursor-pointer"
        >
          <Compass size={13} className="text-cyan-400" />
          <span>NER COMMAND EXTENT</span>
        </button>

        <button
          onClick={toggle3D}
          className={`glass-panel px-3 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer ${
            is3D 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
              : 'border-white/10 text-slate-300 hover:border-white/20'
          }`}
          title="Toggle 3D mountain terrain pitch"
        >
          <Eye size={13} />
          <span>{is3D ? '3D ACTIVE' : '3D TOPO'}</span>
        </button>
      </div>

      {/* Bottom Left Basemap Switcher */}
      <div className="absolute bottom-6 left-3 z-20 glass-panel p-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-xl">
        {[
          { key: 'dark', label: 'Dark Matter' },
          { key: 'satellite', label: 'Satellite' },
          { key: 'topo', label: 'Topographic' }
        ].map(style => (
          <button
            key={style.key}
            onClick={() => switchStyle(style.key)}
            className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded transition-all cursor-pointer ${
              activeStyleKey === style.key
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* Bottom Right Legend & Attribution */}
      <div className="absolute bottom-6 right-3 z-10 glass-panel px-3 py-1.5 rounded text-[10px] text-slate-400 font-mono border border-white/10 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Landslide Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Target Pin</span>
        </div>
        <span className="text-slate-600">|</span>
        <span>SRTM DEM · CARTODB</span>
      </div>
      
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#070b14]/90 z-30">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-cyan-300">CALIBRATING GEOSPATIAL TILES...</span>
          </div>
        </div>
      )}
    </div>
  );
}
