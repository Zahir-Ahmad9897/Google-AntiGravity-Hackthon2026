import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { SCENARIO_METADATA } from '../config/appConfig';
import { theme, withAlpha } from '../config/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const MAP_SIZE = 500;
const TILE_SIZE = 256;

type MapPoint = { lat: number; lng: number };

const MAP_CENTERS: Record<string, MapPoint> = {
  g10_urban_flooding: { lat: 33.6767, lng: 73.0149 },
  peshawar_ring_road_blast: { lat: 34.0062, lng: 71.5608 },
  ambulance_rain_congestion: { lat: 33.6841, lng: 73.0176 },
  custom_permission_input: { lat: 33.6767, lng: 73.0149 },
};

interface Props {
  scenarioId: string;
  showAfter?: boolean;
  locationHint?: string;
}

export default function MapCanvasWidget({ scenarioId, showAfter = true, locationHint = '' }: Props) {
  const meta = SCENARIO_METADATA[scenarioId];
  const [after, setAfter] = useState(showAfter);
  const [weatherVisible, setWeatherVisible] = useState(Boolean(meta?.weather.isCrisisFactor));
  const [mapZoom, setMapZoom] = useState(14);
  const [mapCenter, setMapCenter] = useState<MapPoint>(resolveMapCenter(scenarioId, locationHint));
  const [query, setQuery] = useState('');
  const [placeLabel, setPlaceLabel] = useState('Search a road, shop, hospital, or area');
  const [nearbyPlaces, setNearbyPlaces] = useState<string[]>([]);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => setAfter(showAfter), [showAfter]);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, [progress]);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = Math.min(2.4, Math.max(0.82, savedScale.value * event.scale));
    });

  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const drops = useMemo(() => buildRainDrops(scenarioId), [scenarioId]);

  useEffect(() => {
    setMapCenter(resolveMapCenter(scenarioId, locationHint));
  }, [scenarioId, locationHint]);

  useEffect(() => {
    if (mapZoom < 16) {
      setNearbyPlaces([]);
      return;
    }
    let cancelled = false;
    fetchNearbyPlaces(mapCenter)
      .then((places) => {
        if (!cancelled) setNearbyPlaces(places);
      })
      .catch(() => {
        if (!cancelled) setNearbyPlaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mapCenter, mapZoom]);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setPlaceLabel('Searching map...');
    try {
      const result = await searchPlace(trimmed, mapCenter);
      if (!result) {
        setPlaceLabel('No nearby place found');
        return;
      }
      setMapCenter({ lat: Number(result.lat), lng: Number(result.lon) });
      setMapZoom(Math.max(17, mapZoom));
      setPlaceLabel(result.display_name);
    } catch {
      setPlaceLabel('Search unavailable, map still works offline');
    }
  };

  if (!meta) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Map metadata unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pinch}>
        <Animated.View style={[styles.mapFrame, mapStyle]}>
          <OsmTileLayer center={mapCenter} zoom={mapZoom} />
          {meta.mapLayout === 'g10_grid' && <G10GridMap after={after} progress={progress} />}
          {meta.mapLayout === 'peshawar_ring' && <PeshawarRingMap after={after} progress={progress} />}
          {meta.mapLayout === 'city_intersection' && <CityIntersectionMap after={after} progress={progress} />}
          {weatherVisible && meta.weather.isCrisisFactor && (
            <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
              {drops.map((drop) => <RainDrop key={drop.id} {...drop} />)}
            </Svg>
          )}
        </Animated.View>
      </GestureDetector>

      <View style={styles.searchPanel}>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            placeholder="Search map..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={runSearch}>
            <Text style={styles.searchButtonText}>GO</Text>
          </TouchableOpacity>
        </View>
        <Text numberOfLines={2} style={styles.placeLabel}>{placeLabel}</Text>
        {nearbyPlaces.length > 0 && (
          <View style={styles.nearbyList}>
            {nearbyPlaces.slice(0, 3).map((place) => (
              <Text key={place} numberOfLines={1} style={styles.nearbyItem}>{place}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => setMapZoom((value) => Math.min(18, value + 1))}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.zoomLevel}>z{mapZoom}</Text>
        <TouchableOpacity style={styles.zoomButton} onPress={() => setMapZoom((value) => Math.max(11, value - 1))}>
          <Text style={styles.zoomText}>-</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topControls}>
        <TouchableOpacity
          style={[styles.toggle, !after && styles.toggleActive]}
          onPress={() => setAfter(false)}
        >
          <Text style={[styles.toggleText, !after && styles.toggleTextActive]}>BEFORE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, after && styles.toggleActive]}
          onPress={() => setAfter(true)}
        >
          <Text style={[styles.toggleText, after && styles.toggleTextActive]}>AFTER RESPONSE</Text>
        </TouchableOpacity>
      </View>

      {meta.weather.isCrisisFactor && (
        <TouchableOpacity style={styles.weatherToggle} onPress={() => setWeatherVisible((value) => !value)}>
          <Text style={styles.weatherToggleText}>{weatherVisible ? 'Hide rain' : 'Show rain'}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendText}>🟢 Normal</Text>
        <Text style={styles.legendText}>🟠 Congested</Text>
        <Text style={styles.legendText}>🔴 Rerouted</Text>
        <Text style={styles.legendText}>🔵 Flooded</Text>
        <Text style={styles.legendText}>🚑 Unit</Text>
      </View>
    </View>
  );
}

function BaseMap({ children }: { children: React.ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
      <Rect width="100%" height="100%" fill="rgba(12, 16, 14, 0.2)" />
      {children}
    </Svg>
  );
}

function OsmTileLayer({ center, zoom }: { center: MapPoint; zoom: number }) {
  const tiles = useMemo(() => buildTiles(center, zoom), [center, zoom]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {tiles.map((tile) => (
        <Image
          key={`${tile.z}-${tile.x}-${tile.y}`}
          source={{ uri: `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png` }}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
        />
      ))}
      <View style={styles.tileWash} />
    </View>
  );
}

function G10GridMap({ after, progress }: { after: boolean; progress: SharedValue<number> }) {
  return (
    <BaseMap>
      {[80, 140, 200, 260, 320].map((y, index) => (
        <G key={`h-${y}`}>
          <Line x1={0} y1={y} x2={MAP_SIZE} y2={y} stroke={theme.colors.textMuted} strokeWidth={2} />
          <SvgText x={12} y={y - 8} fill={theme.colors.textSecondary} fontSize={10}>Street {index + 1}</SvgText>
        </G>
      ))}
      {[80, 180, 280, 380].map((x, index) => (
        <G key={`v-${x}`}>
          <Line x1={x} y1={0} x2={x} y2={MAP_SIZE} stroke={theme.colors.textMuted} strokeWidth={2} />
          <SvgText x={x + 6} y={36} fill={theme.colors.textSecondary} fontSize={10}>
            {['Markaz Ave', 'Service Rd', 'IJP Road', 'Expressway'][index]}
          </SvgText>
        </G>
      ))}
      <Rect
        x={130}
        y={130}
        width={200}
        height={160}
        fill={theme.opacity.floodZone}
        stroke={theme.colors.primary}
        strokeWidth={2}
      />
      {after ? (
        <>
          <Line x1={130} y1={200} x2={330} y2={200} stroke={theme.colors.danger} strokeWidth={8} />
          <Line x1={130} y1={260} x2={280} y2={260} stroke={theme.colors.danger} strokeWidth={8} />
          <Line x1={280} y1={130} x2={280} y2={290} stroke={theme.colors.warning} strokeWidth={8} />
          <Line x1={380} y1={0} x2={380} y2={MAP_SIZE} stroke={theme.colors.danger} strokeWidth={8} />
          <Line x1={0} y1={140} x2={MAP_SIZE} y2={140} stroke={theme.colors.danger} strokeWidth={8} />
          <EmergencyCircle progress={progress} xRange={[380, 380]} yRange={[440, 255]} />
        </>
      ) : (
        <>
          <Line x1={0} y1={200} x2={MAP_SIZE} y2={200} stroke={theme.colors.success} strokeWidth={6} />
          <Line x1={0} y1={260} x2={MAP_SIZE} y2={260} stroke={theme.colors.success} strokeWidth={6} />
        </>
      )}
    </BaseMap>
  );
}

function PeshawarRingMap({ after, progress }: { after: boolean; progress: SharedValue<number> }) {
  return (
    <BaseMap>
      <Path
        d="M 50 405 Q 250 40 450 405"
        fill="none"
        stroke={theme.colors.success}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Line x1={150} y1={330} x2={350} y2={330} stroke={theme.colors.success} strokeWidth={4} />
      <Line x1={205} y1={250} x2={295} y2={250} stroke={theme.colors.success} strokeWidth={4} />
      <SvgText x={80} y={420} fill={theme.colors.textSecondary} fontSize={12}>Ring Road</SvgText>
      <SvgText x={180} y={344} fill={theme.colors.textSecondary} fontSize={10}>Inner city diversion</SvgText>
      <Polygon
        points="250,132 262,160 292,166 266,181 272,212 250,192 228,212 234,181 208,166 238,160"
        fill={theme.colors.warning}
      />
      {after && (
        <>
          <Path
            d="M 214 192 Q 250 120 286 192"
            fill="none"
            stroke={theme.colors.danger}
            strokeWidth={15}
            strokeLinecap="round"
          />
          <Path
            d="M 135 310 Q 250 382 365 310"
            fill="none"
            stroke={theme.colors.danger}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
          <EmergencyCircle progress={progress} xRange={[135, 365]} yRange={[310, 310]} />
        </>
      )}
    </BaseMap>
  );
}

function CityIntersectionMap({ after, progress }: { after: boolean; progress: SharedValue<number> }) {
  return (
    <BaseMap>
      <Line x1={0} y1={250} x2={MAP_SIZE} y2={250} stroke={theme.colors.success} strokeWidth={18} />
      <Line x1={250} y1={0} x2={250} y2={MAP_SIZE} stroke={theme.colors.success} strokeWidth={18} />
      <SvgText x={18} y={235} fill={theme.colors.textSecondary} fontSize={12}>Main Blvd</SvgText>
      <SvgText x={263} y={36} fill={theme.colors.textSecondary} fontSize={12}>Cross St</SvgText>
      <Circle cx={250} cy={250} r={72} fill={theme.opacity.congestionZone} />
      {after && (
        <>
          <Line x1={100} y1={250} x2={255} y2={250} stroke={theme.colors.danger} strokeWidth={18} />
          <Line x1={0} y1={154} x2={MAP_SIZE} y2={154} stroke={theme.colors.danger} strokeWidth={8} />
          <PriorityCorridor />
          <AmbulanceText progress={progress} />
        </>
      )}
    </BaseMap>
  );
}

function PriorityCorridor() {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(withTiming(24, { duration: 900 }), -1, false);
  }, [offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <AnimatedLine
      x1={0}
      y1={250}
      x2={MAP_SIZE}
      y2={250}
      stroke={theme.colors.primary}
      strokeWidth={4}
      strokeDasharray="8 4"
      animatedProps={animatedProps}
    />
  );
}

function AmbulanceText({ progress }: { progress: SharedValue<number> }) {
  const animatedProps = useAnimatedProps(() => ({
    x: interpolate(progress.value, [0, 1], [12, 450]),
    y: 241,
  }));

  return (
    <AnimatedSvgText animatedProps={animatedProps} fill={theme.colors.textPrimary} fontSize={26}>
      🚑
    </AnimatedSvgText>
  );
}

function EmergencyCircle({
  progress,
  xRange,
  yRange,
}: {
  progress: SharedValue<number>;
  xRange: [number, number];
  yRange: [number, number];
}) {
  const animatedProps = useAnimatedProps(() => ({
    cx: interpolate(progress.value, [0, 1], xRange),
    cy: interpolate(progress.value, [0, 1], yRange),
  }));

  return (
    <AnimatedCircle
      r={7}
      fill={theme.colors.danger}
      stroke={theme.colors.primary}
      strokeWidth={3}
      animatedProps={animatedProps}
    />
  );
}

function RainDrop({ x, delay, duration, radius }: { id: string; x: number; delay: number; duration: number; radius: number }) {
  const cy = useSharedValue(-20);

  useEffect(() => {
    cy.value = withDelay(delay, withRepeat(withTiming(MAP_SIZE + 20, { duration }), -1, false));
  }, [cy, delay, duration]);

  const animatedProps = useAnimatedProps(() => ({
    cy: cy.value,
  }));

  return (
    <AnimatedCircle
      cx={x}
      r={radius}
      fill={withAlpha(theme.colors.primary, 0.72)}
      animatedProps={animatedProps}
    />
  );
}

function buildRainDrops(seed: string) {
  const base = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 40 }, (_, index) => {
    const value = (base + index * 47) % MAP_SIZE;
    return {
      id: `${seed}-${index}`,
      x: value,
      delay: (index % 12) * 90,
      duration: 800 + (index % 5) * 90,
      radius: 1.8 + (index % 3) * 0.6,
    };
  });
}

function resolveMapCenter(scenarioId: string, locationHint: string): MapPoint {
  const hint = `${scenarioId} ${locationHint}`.toLowerCase();
  if (hint.includes('peshawar') || hint.includes('ring road') || hint.includes('sadar')) {
    return MAP_CENTERS.peshawar_ring_road_blast;
  }
  if (hint.includes('ambulance') || hint.includes('pims') || hint.includes('srinagar')) {
    return MAP_CENTERS.ambulance_rain_congestion;
  }
  return MAP_CENTERS[scenarioId] ?? MAP_CENTERS.custom_permission_input;
}

function buildTiles(center: MapPoint, zoom: number) {
  const centerPx = latLngToWorldPixel(center, zoom);
  const topLeft = { x: centerPx.x - MAP_SIZE / 2, y: centerPx.y - MAP_SIZE / 2 };
  const minX = Math.floor(topLeft.x / TILE_SIZE) - 1;
  const maxX = Math.floor((topLeft.x + MAP_SIZE) / TILE_SIZE) + 1;
  const minY = Math.floor(topLeft.y / TILE_SIZE) - 1;
  const maxY = Math.floor((topLeft.y + MAP_SIZE) / TILE_SIZE) + 1;
  const maxTile = 2 ** zoom;
  const tiles: Array<{ x: number; y: number; z: number; left: number; top: number }> = [];

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        x: wrappedX,
        y,
        z: zoom,
        left: Math.round(x * TILE_SIZE - topLeft.x),
        top: Math.round(y * TILE_SIZE - topLeft.y),
      });
    }
  }
  return tiles;
}

function latLngToWorldPixel(point: MapPoint, zoom: number) {
  const sinLat = Math.sin((point.lat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

async function searchPlace(query: string, center: MapPoint): Promise<{ lat: string; lon: string; display_name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pk&q=${encodeURIComponent(`${query} near ${center.lat.toFixed(4)},${center.lng.toFixed(4)}`)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.[0] ?? null;
}

async function fetchNearbyPlaces(center: MapPoint): Promise<string[]> {
  const delta = 0.012;
  const south = (center.lat - delta).toFixed(5);
  const west = (center.lng - delta).toFixed(5);
  const north = (center.lat + delta).toFixed(5);
  const east = (center.lng + delta).toFixed(5);
  const query = `
    [out:json][timeout:8];
    (
      node["shop"](${south},${west},${north},${east});
      node["amenity"](${south},${west},${north},${east});
    );
    out 12;
  `;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) return [];
  const payload = await response.json();
  const names = (payload.elements || [])
    .map((item: any) => item.tags?.name)
    .filter(Boolean);
  return Array.from(new Set(names)).slice(0, 6) as string[];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  mapFrame: {
    flex: 1,
    backgroundColor: '#dce2dc',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tileWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 10, 0.2)',
  },
  emptyText: {
    margin: theme.spacing.s16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  topControls: {
    position: 'absolute',
    top: 104,
    right: theme.spacing.s16,
    flexDirection: 'row',
    padding: theme.spacing.s4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  toggle: {
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  toggleTextActive: {
    color: theme.colors.background,
  },
  weatherToggle: {
    position: 'absolute',
    top: 150,
    right: theme.spacing.s16,
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  weatherToggleText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  legend: {
    position: 'absolute',
    right: theme.spacing.s12,
    bottom: theme.spacing.s12,
    left: theme.spacing.s12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: theme.spacing.s8,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  searchPanel: {
    position: 'absolute',
    top: theme.spacing.s16,
    right: theme.spacing.s16,
    left: theme.spacing.s16,
    padding: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
  },
  searchRow: {
    flexDirection: 'row',
    gap: theme.spacing.s8,
  },
  searchInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: theme.spacing.s12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    backgroundColor: theme.colors.background,
  },
  searchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  searchButtonText: {
    color: theme.colors.background,
    fontFamily: theme.typography.fontBold,
    fontSize: 12,
  },
  placeLabel: {
    marginTop: theme.spacing.s8,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    lineHeight: 15,
  },
  nearbyList: {
    marginTop: theme.spacing.s8,
    gap: theme.spacing.s4,
  },
  nearbyItem: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontBold,
    fontSize: 11,
  },
  zoomControls: {
    position: 'absolute',
    top: 104,
    left: theme.spacing.s16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
  },
  zoomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 38,
  },
  zoomText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontBold,
    fontSize: 22,
  },
  zoomLevel: {
    paddingVertical: theme.spacing.s4,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontBold,
    fontSize: 10,
  },
});
