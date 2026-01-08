import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

type GlassCardProps = ViewProps & {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function GlassCard({
  children,
  intensity = 40,
  tint = 'light',
  className = '',
  animated = false,
  style,
  ...props
}: GlassCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (animated) {
    return (
      <Animated.View style={[styles.container, animatedStyle, style]} {...props}>
        <BlurView intensity={intensity} tint={tint} style={styles.blur}>
          <View className={`p-4 ${className}`}>{children}</View>
        </BlurView>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView intensity={intensity} tint={tint} style={styles.blur}>
        <View className={`p-4 ${className}`}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blur: {
    flex: 1,
  },
});
