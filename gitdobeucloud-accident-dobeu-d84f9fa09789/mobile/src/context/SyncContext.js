import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';

const SyncContext = createContext();

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
      
      // Auto-sync when coming back online
      if (state.isConnected && state.isInternetReachable) {
        syncPendingItems();
      }
    });

    // Check initial sync status
    checkPendingSyncs();

    return () => unsubscribe();
  }, []);

  const checkPendingSyncs = async () => {
    try {
      const count = await syncService.getPendingCount();
      setPendingSyncs(count);
    } catch (error) {
      console.error('Error checking pending syncs:', error);
    }
  };

  const syncPendingItems = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      const synced = await syncService.syncAll();
      setPendingSyncs(await syncService.getPendingCount());
      return synced;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const queueForSync = async (entityType, entityId, operation, payload) => {
    try {
      await syncService.queueItem(entityType, entityId, operation, payload);
      setPendingSyncs(await syncService.getPendingCount());
    } catch (error) {
      console.error('Error queueing for sync:', error);
      throw error;
    }
  };

  const value = {
    isOnline,
    isSyncing,
    pendingSyncs,
    syncPendingItems,
    queueForSync,
    checkPendingSyncs
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

