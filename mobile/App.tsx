import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';
import { useSyncStore } from './src/stores/syncStore';
import { SyncService } from './src/services/SyncService';

export default function App() {
  const { loadStoredAuth } = useAuthStore();
  const { processPendingQueue } = useSyncStore();

  useEffect(() => {
    // Load stored authentication on app start
    loadStoredAuth();
    
    // Start sync service for offline queue
    const syncInterval = setInterval(() => {
      processPendingQueue();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(syncInterval);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
