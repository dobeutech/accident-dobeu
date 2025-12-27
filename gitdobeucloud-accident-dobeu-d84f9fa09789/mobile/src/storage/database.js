import * as SQLite from 'expo-sqlite';

let db = null;

export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('accident_app.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        fleet_id TEXT,
        driver_id TEXT,
        report_number TEXT UNIQUE,
        incident_type TEXT,
        status TEXT DEFAULT 'draft',
        latitude REAL,
        longitude REAL,
        address TEXT,
        incident_date TEXT,
        custom_fields TEXT,
        is_offline INTEGER DEFAULT 1,
        synced_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS report_photos (
        id TEXT PRIMARY KEY,
        report_id TEXT,
        file_key TEXT,
        file_url TEXT,
        file_size INTEGER,
        mime_type TEXT,
        order_index INTEGER,
        local_path TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS report_audio (
        id TEXT PRIMARY KEY,
        report_id TEXT,
        file_key TEXT,
        file_url TEXT,
        file_size INTEGER,
        duration_seconds INTEGER,
        local_path TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        fleet_id TEXT,
        user_id TEXT,
        entity_type TEXT,
        entity_id TEXT,
        operation TEXT,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_reports_fleet_id ON reports(fleet_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const reportStorage = {
  async save(report) {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO reports 
       (id, fleet_id, driver_id, report_number, incident_type, status, 
        latitude, longitude, address, incident_date, custom_fields, is_offline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [
        report.id,
        report.fleet_id,
        report.driver_id,
        report.report_number,
        report.incident_type,
        report.status || 'draft',
        report.latitude,
        report.longitude,
        report.address,
        report.incident_date,
        JSON.stringify(report.custom_fields || {})
      ]
    );
  },
  
  async getAll() {
    const db = getDatabase();
    const results = await db.getAllAsync('SELECT * FROM reports ORDER BY created_at DESC');
    return results.map(row => ({
      ...row,
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
    }));
  },
  
  async getById(id) {
    const db = getDatabase();
    const result = await db.getFirstAsync('SELECT * FROM reports WHERE id = ?', [id]);
    if (result) {
      result.custom_fields = result.custom_fields ? JSON.parse(result.custom_fields) : {};
    }
    return result;
  },
  
  async update(id, updates) {
    const db = getDatabase();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    if (updates.custom_fields) {
      const index = Object.keys(updates).indexOf('custom_fields');
      values[index] = JSON.stringify(updates.custom_fields);
    }
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE reports SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      values
    );
  },
  
  async delete(id) {
    const db = getDatabase();
    await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  }
};

export const photoStorage = {
  async save(photo) {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO report_photos 
       (id, report_id, file_key, file_url, file_size, mime_type, order_index, local_path, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photo.id,
        photo.report_id,
        photo.file_key,
        photo.file_url,
        photo.file_size,
        photo.mime_type,
        photo.order_index || 0,
        photo.local_path,
        photo.synced || 0
      ]
    );
  },
  
  async getByReportId(reportId) {
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM report_photos WHERE report_id = ? ORDER BY order_index',
      [reportId]
    );
  },
  
  async markSynced(id) {
    const db = getDatabase();
    await db.runAsync('UPDATE report_photos SET synced = 1 WHERE id = ?', [id]);
  }
};

export const audioStorage = {
  async save(audio) {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO report_audio 
       (id, report_id, file_key, file_url, file_size, duration_seconds, local_path, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        audio.id,
        audio.report_id,
        audio.file_key,
        audio.file_url,
        audio.file_size,
        audio.duration_seconds,
        audio.local_path,
        audio.synced || 0
      ]
    );
  },
  
  async getByReportId(reportId) {
    const db = getDatabase();
    return await db.getAllAsync(
      'SELECT * FROM report_audio WHERE report_id = ? ORDER BY created_at',
      [reportId]
    );
  },
  
  async markSynced(id) {
    const db = getDatabase();
    await db.runAsync('UPDATE report_audio SET synced = 1 WHERE id = ?', [id]);
  }
};

