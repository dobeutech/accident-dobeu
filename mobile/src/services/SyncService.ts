import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { useAuthStore } from '../stores/authStore';

class SyncServiceClass {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const token = useAuthStore.getState().token;
    
    if (!token) {
      console.warn('Cannot connect to socket: no auth token');
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_CONFIG.WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Handle incoming events
    this.socket.on('report:status:changed', (data) => {
      console.log('Report status changed:', data);
      // Could update local store here
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emit events
  emitReportStarted(reportId: string) {
    this.socket?.emit('report:started', { reportId });
  }

  emitPhotoUploaded(reportId: string, photoUrl: string) {
    this.socket?.emit('report:photo:uploaded', { reportId, photoUrl });
  }

  emitStatusUpdated(reportId: string, status: string) {
    this.socket?.emit('report:status:updated', { reportId, status });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const SyncService = new SyncServiceClass();
