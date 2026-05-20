import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

interface Props {
  scenarioId: string;
  showAfter?: boolean;
}

export default function MapCanvasWidget({ scenarioId, showAfter = true }: Props) {
  const meta = SCENARIO_METADATA[scenarioId];
  const [after, setAfter] = useState(showAfter);
  const [weatherVisible, setWeatherVisible] = useState(Boolean(meta?.weather.isCrisisFactor));
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
        <Text style={styles.legendText}>🔴 Blocked</Text>
        <Text style={styles.legendText}>🟠 Congested</Text>
        <Text style={styles.legendText}>🟢 Rerouted</Text>
        <Text style={styles.legendText}>🔵 Flooded</Text>
        <Text style={styles.legendText}>🚑 Unit</Text>
      </View>
    </View>
  );
}

function BaseMap({ children }: { children: React.ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
      <Rect width="100%" height="100%" fill={theme.colors.background} />
      {children}
    </Svg>
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
          <Line x1={380} y1={0} x2={380} y2={MAP_SIZE} stroke={theme.colors.success} strokeWidth={8} />
          <Line x1={0} y1={140} x2={MAP_SIZE} y2={140} stroke={theme.colors.success} strokeWidth={8} />
          <EmergencyCircle progress={progress} xRange={[380, 380]} yRange={[440, 255]} />
        </>
      ) : (
        <>
          <Line x1={0} y1={200} x2={MAP_SIZE} y2={200} stroke={theme.colors.textMuted} strokeWidth={6} />
          <Line x1={0} y1={260} x2={MAP_SIZE} y2={260} stroke={theme.colors.textMuted} strokeWidth={6} />
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
        stroke={theme.colors.textMuted}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Line x1={150} y1={330} x2={350} y2={330} stroke={theme.colors.textMuted} strokeWidth={4} />
      <Line x1={205} y1={250} x2={295} y2={250} stroke={theme.colors.textMuted} strokeWidth={4} />
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
            stroke={theme.colors.success}
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
      <Line x1={0} y1={250} x2={MAP_SIZE} y2={250} stroke={theme.colors.textMuted} strokeWidth={18} />
      <Line x1={250} y1={0} x2={250} y2={MAP_SIZE} stroke={theme.colors.textMuted} strokeWidth={18} />
      <SvgText x={18} y={235} fill={theme.colors.textSecondary} fontSize={12}>Main Blvd</SvgText>
      <SvgText x={263} y={36} fill={theme.colors.textSecondary} fontSize={12}>Cross St</SvgText>
      <Circle cx={250} cy={250} r={72} fill={theme.opacity.congestionZone} />
      {after && (
        <>
          <Line x1={100} y1={250} x2={255} y2={250} stroke={theme.colors.danger} strokeWidth={18} />
          <Line x1={0} y1={154} x2={MAP_SIZE} y2={154} stroke={theme.colors.success} strokeWidth={8} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  mapFrame: {
    flex: 1,
  },
  emptyText: {
    margin: theme.spacing.s16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  topControls: {
    position: 'absolute',
    top: theme.spacing.s16,
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
    top: 62,
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
});
