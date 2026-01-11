import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { useNotifications } from '../src/hooks/useNotifications';
import '../src/styles/global.css';

/**
 * Handles push notification registration and listeners
 * Must be inside AuthProvider to access user state
 */
function NotificationHandler() {
  const { user } = useAuth();
  const {
    registerForPushNotifications,
    unregisterPushToken,
    setupListeners,
    checkInitialNotification,
  } = useNotifications();
  const previousUserId = useRef<string | null>(null);
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupListeners();

    // Check if app was opened from a notification
    checkInitialNotification();

    return cleanup;
  }, [setupListeners, checkInitialNotification]);

  useEffect(() => {
    const handleAuthChange = async () => {
      const currentUserId = user?.id || null;

      // User logged in
      if (currentUserId && currentUserId !== previousUserId.current && !hasRegistered.current) {
        console.log('User logged in, registering for push notifications...');
        hasRegistered.current = true;
        await registerForPushNotifications();
      }

      // User logged out
      if (!currentUserId && previousUserId.current) {
        console.log('User logged out, unregistering push token...');
        hasRegistered.current = false;
        await unregisterPushToken();
      }

      previousUserId.current = currentUserId;
    };

    handleAuthChange();
  }, [user?.id, registerForPushNotifications, unregisterPushToken]);

  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationHandler />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#020617' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
