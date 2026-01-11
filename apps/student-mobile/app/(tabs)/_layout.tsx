import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Platform } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconName = 'home' | 'document-text' | 'calendar' | 'chatbubbles' | 'person';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  name: TabIconName;
  label: string;
}

function TabBarIcon({ focused, color, name, label }: TabBarIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.85);

  scale.value = withSpring(focused ? 1 : 0.85, {
    damping: 15,
    stiffness: 200,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
      {focused ? (
        <LinearGradient
          colors={['#0ea5e9', '#0284c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeIconBg}
        >
          <Ionicons name={name} size={22} color="#ffffff" />
        </LinearGradient>
      ) : (
        <View style={styles.inactiveIconBg}>
          <Ionicons name={name} size={22} color={color} />
        </View>
      )}
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? '#ffffff' : 'rgba(255,255,255,0.5)' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const handlePress = (route: any, isFocused: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const icons: Record<string, TabIconName> = {
    index: 'home',
    documents: 'document-text',
    sessions: 'calendar',
    messages: 'chatbubbles',
    profile: 'person',
  };

  const labels: Record<string, string> = {
    index: 'Accueil',
    documents: 'Documents',
    sessions: 'Sessions',
    messages: 'Messages',
    profile: 'Profil',
  };

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
      <BlurView intensity={60} tint="dark" style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const iconName = icons[route.name] || 'ellipse';
            const label = labels[route.name] || route.name;

            return (
              <Pressable
                key={route.key}
                onPress={() => handlePress(route, isFocused)}
                style={styles.tabButton}
              >
                <TabBarIcon
                  focused={isFocused}
                  color="rgba(255,255,255,0.5)"
                  name={iconName}
                  label={label}
                />
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading, profileLoading, profile, isAccessExpired } = useAuth();

  // Show loading while checking auth or loading profile
  if (loading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Not authenticated -> redirect to login
  if (!session) {
    return <Redirect href="/login" />;
  }

  // Wait for profile to load
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#020617', '#0a1628', '#0f1f35']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  // Not a student -> redirect to login
  if (profile.role !== 'student') {
    return <Redirect href="/login?error=not_student" />;
  }

  // Access expired -> redirect to expired screen
  if (isAccessExpired) {
    return <Redirect href="/expired" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="sessions" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBarContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconBg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
