import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { SyncQueueItem } from '../types';
import { ApiService } from '../services/ApiService';

const SYNC_QUEUE_KEY = 'sync_queue';
const MAX_RETRIES = 3;

interface SyncStore {
  queue: SyncQueueItem[];
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncTime: string | null;
  
  // Actions
  addToQueue: (item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  updateQueueItem: (id: string, updates: Partial<SyncQueueItem>) => Promise<void>;
  processPendingQueue: () => Promise<void>;
  loadQueue: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  clearCompletedItems: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>((set, get) => ({
  queue: [],
  isSyncing: false,
  isOnline: true,
  lastSyncTime: null,

  addToQueue: async (item) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const { queue } = get();
    const updatedQueue = [...queue, newItem];
    
    set({ queue: updatedQueue });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
    
    // Try to process immediately if online
    const { isOnline, processPendingQueue } = get();
    if (isOnline) {
      processPendingQueue();
    }
  },

  removeFromQueue: async (id: string) => {
    const { queue } = get();
    const updatedQueue = queue.filter(item => item.id !== id);
    
    set({ queue: updatedQueue });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  },

  updateQueueItem: async (id: string, updates: Partial<SyncQueueItem>) => {
    const { queue } = get();
    const updatedQueue = queue.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    
    set({ queue: updatedQueue });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
  },

  processPendingQueue: async () => {
    const { queue, isSyncing, isOnline, updateQueueItem, removeFromQueue } = get();
    
    // Check if already syncing or offline
    if (isSyncing || !isOnline) return;
    
    // Check network status
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      set({ isOnline: false });
      return;
    }
    
    // Get pending items
    const pendingItems = queue.filter(
      item => item.status === 'pending' || 
      (item.status === 'failed' && item.retryCount < MAX_RETRIES)
    );
    
    if (pendingItems.length === 0) return;
    
    set({ isSyncing: true });
    
    for (const item of pendingItems) {
      try {
        await updateQueueItem(item.id, { status: 'processing' });
        
        let success = false;
        
        switch (item.entityType) {
          case 'report':
            success = await processReportSync(item);
            break;
          case 'photo':
            success = await processPhotoSync(item);
            break;
          case 'audio':
            success = await processAudioSync(item);
            break;
        }
        
        if (success) {
          await updateQueueItem(item.id, { status: 'completed' });
        } else {
          await updateQueueItem(item.id, { 
            status: 'failed',
            retryCount: item.retryCount + 1,
          });
        }
        
      } catch (error: any) {
        console.error('Sync error:', error);
        await updateQueueItem(item.id, { 
          status: 'failed',
          retryCount: item.retryCount + 1,
          errorMessage: error.message,
        });
      }
    }
    
    set({ 
      isSyncing: false, 
      lastSyncTime: new Date().toISOString() 
    });
    
    // Clear completed items
    await get().clearCompletedItems();
  },

  loadQueue: async () => {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueJson) {
        set({ queue: JSON.parse(queueJson) });
      }
      
      // Subscribe to network status changes
      NetInfo.addEventListener(state => {
        set({ isOnline: state.isConnected ?? false });
        if (state.isConnected) {
          get().processPendingQueue();
        }
      });
      
    } catch (error) {
      console.error('Load queue error:', error);
    }
  },

  setOnlineStatus: (isOnline: boolean) => {
    set({ isOnline });
  },

  clearCompletedItems: async () => {
    const { queue } = get();
    const pendingQueue = queue.filter(item => item.status !== 'completed');
    
    set({ queue: pendingQueue });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(pendingQueue));
  },
}));

// Helper functions for processing different entity types
async function processReportSync(item: SyncQueueItem): Promise<boolean> {
  const { operation, payload } = item;
  
  try {
    switch (operation) {
      case 'create':
        const createResponse = await ApiService.createReport(payload);
        return !!createResponse.data;
        
      case 'update':
        const updateResponse = await ApiService.updateReport(item.entityId, payload);
        return !!updateResponse.data;
        
      case 'delete':
        const deleteResponse = await ApiService.deleteReport(item.entityId);
        return !deleteResponse.error;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Report sync error:', error);
    return false;
  }
}

async function processPhotoSync(item: SyncQueueItem): Promise<boolean> {
  const { payload } = item;
  
  try {
    const response = await ApiService.uploadPhoto(
      payload.reportId,
      payload.localUri,
      payload.description
    );
    return !!response.data;
  } catch (error) {
    console.error('Photo sync error:', error);
    return false;
  }
}

async function processAudioSync(item: SyncQueueItem): Promise<boolean> {
  const { payload } = item;
  
  try {
    const response = await ApiService.uploadAudio(
      payload.reportId,
      payload.localUri,
      payload.description
    );
    return !!response.data;
  } catch (error) {
    console.error('Audio sync error:', error);
    return false;
  }
}

// Initialize queue on import
useSyncStore.getState().loadQueue();
