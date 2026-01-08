import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'ocean' | 'gold' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
};

const variants = {
  default: {
    bg: 'bg-navy-100',
    text: 'text-navy-700',
  },
  success: {
    bg: 'bg-success-100',
    text: 'text-success-700',
  },
  warning: {
    bg: 'bg-warning-100',
    text: 'text-warning-600',
  },
  error: {
    bg: 'bg-error-100',
    text: 'text-error-600',
  },
  ocean: {
    bg: 'bg-ocean-100',
    text: 'text-ocean-700',
  },
  gold: {
    bg: 'bg-gold-100',
    text: 'text-gold-700',
  },
  outline: {
    bg: 'bg-transparent border border-navy-200',
    text: 'text-navy-600',
  },
};

const sizes = {
  sm: {
    container: 'px-2 py-0.5 rounded-md',
    text: 'text-[10px]',
  },
  md: {
    container: 'px-2.5 py-1 rounded-lg',
    text: 'text-xs',
  },
  lg: {
    container: 'px-3 py-1.5 rounded-xl',
    text: 'text-sm',
  },
};

export function Badge({ label, variant = 'default', size = 'md', icon }: BadgeProps) {
  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <View className={`flex-row items-center ${variantStyles.bg} ${sizeStyles.container}`}>
      {icon && <Text className="mr-1">{icon}</Text>}
      <Text className={`font-semibold ${variantStyles.text} ${sizeStyles.text}`}>{label}</Text>
    </View>
  );
}

type GradientBadgeProps = {
  label: string;
  colors?: string[];
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
};

export function GradientBadge({
  label,
  colors = ['#0ea5e9', '#8b5cf6'],
  size = 'md',
  icon,
}: GradientBadgeProps) {
  const sizeStyles = sizes[size];

  return (
    <View style={styles.gradientContainer}>
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View className={`flex-row items-center ${sizeStyles.container}`}>
          {icon && <Text className="mr-1">{icon}</Text>}
          <Text className={`font-semibold text-white ${sizeStyles.text}`}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 12,
  },
});
