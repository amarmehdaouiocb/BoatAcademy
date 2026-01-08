import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { session, loading, profile } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
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

  // Logged in but not a student -> show error or redirect to login
  if (profile && profile.role !== 'student') {
    // Non-student users should use the admin-web app
    return <Redirect href="/login" />;
  }

  // Logged in as student -> go to tabs
  return <Redirect href="/(tabs)" />;
}
