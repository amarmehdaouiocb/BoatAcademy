import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { session, loading, profileLoading, profile } = useAuth();

  // Show loading spinner while checking auth state or loading profile
  if (loading || profileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  // Not logged in -> go to login
  if (!session) {
    return <Redirect href="/login" />;
  }

  // Session exists but profile not yet loaded -> wait (prevents race condition)
  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  // Logged in but not a student -> redirect to login with message
  // Non-student users should use the admin-web app
  if (profile.role !== 'student') {
    return <Redirect href="/login?error=not_student" />;
  }

  // Logged in as student -> go to tabs
  return <Redirect href="/(tabs)" />;
}
