import { getDatabase } from '../storage/database';
import { reportService, uploadService } from './api';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

class SyncService {
  async queueItem(entityType, entityId, operation, payload) {
    const db = getDatabase();
    const id = uuidv4();
    
    await db.runAsync(
      `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, entityType, entityId, operation, JSON.stringify(payload)]
    );
    
    return id;
  }
  
  async getPendingCount() {
    const db = getDatabase();
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = ?',
      ['pending']
    );
    return result?.count || 0;
  }
  
  async syncAll() {
    const db = getDatabase();
    const pending = await db.getAllAsync(
      'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at LIMIT 10',
      ['pending']
    );
    
    let synced = 0;
    
    for (const item of pending) {
      try {
        await db.runAsync(
          'UPDATE sync_queue SET status = ? WHERE id = ?',
          ['processing', item.id]
        );
        
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
        
        await db.runAsync(
          'UPDATE sync_queue SET status = ?, processed_at = datetime("now") WHERE id = ?',
          ['completed', item.id]
        );
        
        synced++;
      } catch (error) {
        console.error(`Sync error for ${item.id}:`, error);
        const retryCount = (item.retry_count || 0) + 1;
        
        await db.runAsync(
          `UPDATE sync_queue 
           SET status = ?, retry_count = ?, error_message = ? 
           WHERE id = ?`,
          [
            retryCount >= 3 ? 'failed' : 'pending',
            retryCount,
            error.message,
            item.id
          ]
        );
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

