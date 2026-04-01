import { syncQueueStorage } from '../storage/database';
import { reportService, uploadService } from './api';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

class SyncService {
  async queueItem(entityType, entityId, operation, payload) {
    const id = uuidv4();
    
    await syncQueueStorage.save({
      id,
      entity_type: entityType,
      entity_id: entityId,
      operation,
      payload: JSON.stringify(payload)
    });
    
    return id;
  }
  
  async getPendingCount() {
    return await syncQueueStorage.getPendingCount();
  }
  
  async syncAll() {
    const pending = await syncQueueStorage.getPending(10);
    
    let synced = 0;
    
    for (const item of pending) {
      try {
        await syncQueueStorage.updateStatus(item.id, 'processing');
        
        const payload = JSON.parse(item.payload);
        
        switch (item.entity_type) {
          case 'report':
            await this.syncReport(item.operation, payload);
            break;
          case 'photo':
            await this.syncPhoto(item.operation, payload);
            break;
          case 'audio':
            await this.syncAudio(item.operation, payload);
            break;
        }
        
        await syncQueueStorage.markCompleted(item.id);
        
        synced++;
      } catch (error) {
        console.error(`Sync error for ${item.id}:`, error);
        const retryCount = (item.retry_count || 0) + 1;
        
        await syncQueueStorage.markFailed(item.id, retryCount, error.message);
      }
    }
    
    return synced;
  }
  
  async syncReport(operation, payload) {
    if (operation === 'create') {
      await reportService.create(payload);
    } else if (operation === 'update') {
      await reportService.update(payload.id, payload);
    }
  }
  
  async syncPhoto(operation, payload) {
    if (operation === 'create' && payload.local_path) {
      await uploadService.uploadPhoto(
        payload.report_id,
        payload.local_path,
        (progress) => {
          console.log(`Photo upload progress: ${progress}%`);
        }
      );
    }
  }
  
  async syncAudio(operation, payload) {
    if (operation === 'create' && payload.local_path) {
      await uploadService.uploadAudio(payload.report_id, payload.local_path);
    }
  }
}

export const syncService = new SyncService();

