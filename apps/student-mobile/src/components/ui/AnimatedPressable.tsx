import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PressableProps & {
  scaleValue?: number;
  haptic?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  children: React.ReactNode;
  className?: string;
};

const springConfig = {
  damping: 15,
  stiffness: 400,
  mass: 0.5,
};

export function AnimatedPressable({
  children,
  scaleValue = 0.97,
  haptic = true,
  hapticStyle = 'light',
  onPressIn,
  onPressOut,
  onPress,
  className,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleValue, springConfig);
    if (haptic) {
      const impact =
        hapticStyle === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : hapticStyle === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(impact);
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, springConfig);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressableComponent
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[animatedStyle, style]}
      className={className}
      {...props}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
