import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { AnimatedPressable } from './AnimatedPressable';

type PremiumCardProps = ViewProps & {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient' | 'glass';
  gradientColors?: string[];
  onPress?: () => void;
  delay?: number;
  className?: string;
};

export function PremiumCard({
  children,
  variant = 'default',
  gradientColors,
  onPress,
  delay = 0,
  className = '',
  style,
  ...props
}: PremiumCardProps) {
  const content = (
    <View className={`${className}`} style={style} {...props}>
      {children}
    </View>
  );

  const cardStyles = {
    default: 'bg-white rounded-3xl p-5',
    elevated: 'bg-white rounded-3xl p-5 shadow-card',
    glass: 'bg-white/10 rounded-3xl p-5 border border-white/10',
    gradient: '',
  };

  if (variant === 'gradient') {
    const colors = gradientColors || ['#0ea5e9', '#8b5cf6'];
    const gradientContent = (
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View className={`p-5 ${className}`}>{children}</View>
      </LinearGradient>
    );

    if (onPress) {
      return (
        <Animated.View entering={FadeInDown.delay(delay).springify()}>
          <AnimatedPressable onPress={onPress} style={styles.gradientContainer}>
            {gradientContent}
          </AnimatedPressable>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.gradientContainer}>
        {gradientContent}
      </Animated.View>
    );
  }

  if (onPress) {
    return (
      <Animated.View entering={FadeInDown.delay(delay).springify()}>
        <AnimatedPressable onPress={onPress} className={cardStyles[variant]}>
          {children}
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className={cardStyles[variant]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 24,
  },
});
