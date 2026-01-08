import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

type GradientBackgroundProps = {
  variant?: 'ocean' | 'midnight' | 'sunset' | 'aurora';
  children: React.ReactNode;
};

const gradients = {
  ocean: {
    colors: ['#0a1628', '#0c4a6e', '#0369a1', '#0ea5e9'] as const,
    locations: [0, 0.3, 0.6, 1] as const,
  },
  midnight: {
    colors: ['#020617', '#0a1628', '#0f1f35', '#1e293b'] as const,
    locations: [0, 0.4, 0.7, 1] as const,
  },
  sunset: {
    colors: ['#0f172a', '#1e3a5f', '#7c3aed', '#f97316'] as const,
    locations: [0, 0.4, 0.7, 1] as const,
  },
  aurora: {
    colors: ['#0a1628', '#065f46', '#0ea5e9', '#8b5cf6'] as const,
    locations: [0, 0.3, 0.6, 1] as const,
  },
};

export function GradientBackground({ variant = 'midnight', children }: GradientBackgroundProps) {
  const gradient = gradients[variant];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradient.colors as any}
        locations={[...gradient.locations]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
      />
      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  glowTop: {
    top: -height * 0.2,
    right: -100,
    width: 400,
    height: 400,
    backgroundColor: '#0ea5e9',
  },
  glowBottom: {
    bottom: -height * 0.1,
    left: -150,
    width: 350,
    height: 350,
    backgroundColor: '#8b5cf6',
  },
});
