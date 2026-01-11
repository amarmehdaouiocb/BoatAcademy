import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationData = {
  type?: 'message' | 'session' | 'document' | 'system';
  conversation_id?: string;
  session_id?: string;
  document_type?: string;
  [key: string]: unknown;
};

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  /**
   * Request notification permissions and get Expo push token
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions denied');
        return null;
      }

      // Setup Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Boat Academy',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
          sound: 'default',
        });
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      setExpoPushToken(token);

      // Register token with backend
      await registerTokenWithBackend(token);

      console.log('Push token registered:', token);
      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, []);

  /**
   * Register token with Supabase Edge Function
   */
  const registerTokenWithBackend = async (token: string): Promise<void> => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      const deviceId = Constants.deviceId || undefined;

      const { error } = await supabase.functions.invoke('push-register-token', {
        body: { token, platform, deviceId },
      });

      if (error) {
        console.error('Failed to register token with backend:', error);
      }
    } catch (error) {
      console.error('Error calling push-register-token:', error);
    }
  };

  /**
   * Unregister push token (call on logout)
   */
  const unregisterPushToken = useCallback(async (): Promise<void> => {
    if (!expoPushToken) return;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('token', expoPushToken);

      if (error) {
        console.error('Failed to unregister push token:', error);
      } else {
        setExpoPushToken(null);
        console.log('Push token unregistered');
      }
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }, [expoPushToken]);

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    console.log('Notification tapped:', data);

    // Navigate based on notification type
    switch (data.type) {
      case 'message':
        router.push('/(tabs)/messages');
        break;
      case 'session':
        router.push('/(tabs)/sessions');
        break;
      case 'document':
        router.push('/(tabs)/documents');
        break;
      default:
        // Default to home
        router.push('/(tabs)/');
        break;
    }
  }, []);

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    const data = notification.request.content.data as NotificationData;
    console.log('Notification received in foreground:', notification.request.content.title, data);
    // The notification will be shown as a banner thanks to setNotificationHandler
  }, []);

  /**
   * Setup notification listeners
   */
  const setupListeners = useCallback(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotificationReceived);

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  /**
   * Check for notification that launched the app
   */
  const checkInitialNotification = useCallback(async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      handleNotificationResponse(response);
    }
  }, [handleNotificationResponse]);

  /**
   * Re-register token when app comes to foreground (token may have changed)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - token might have refreshed
        if (expoPushToken) {
          await registerTokenWithBackend(expoPushToken);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [expoPushToken]);

  return {
    expoPushToken,
    permissionStatus,
    registerForPushNotifications,
    unregisterPushToken,
    setupListeners,
    checkInitialNotification,
  };
}
