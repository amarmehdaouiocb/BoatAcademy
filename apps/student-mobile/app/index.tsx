import { Redirect } from 'expo-router';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0a1628', '#0f1f35', '#0c4a6e']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow effects */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" />
        </Animated.View>
      </View>
    </View>
  );
}

export default function Index() {
  const { session, loading, profileLoading, profile } = useAuth();

  // Show loading screen while checking auth state or loading profile
  if (loading || profileLoading) {
    return <LoadingScreen />;
  }

  // Not logged in -> go to login
  if (!session) {
    return <Redirect href="/login" />;
  }

  // Session exists but profile not yet loaded -> wait (prevents race condition)
  if (!profile) {
    return <LoadingScreen />;
  }

  // Logged in but not a student -> redirect to login with message
  // Non-student users should use the admin-web app
  if (profile.role !== 'student') {
    return <Redirect href="/login?error=not_student" />;
  }

  // Logged in as student -> go to tabs
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  glowTop: {
    top: -150,
    right: -100,
    width: 400,
    height: 400,
    backgroundColor: '#0ea5e9',
  },
  glowBottom: {
    bottom: -100,
    left: -150,
    width: 350,
    height: 350,
    backgroundColor: '#8b5cf6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 240,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    tintColor: '#ffffff',
  },
  loaderContainer: {
    marginTop: 40,
  },
});
