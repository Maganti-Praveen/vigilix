/**
 * Socket.IO Service
 * Manages WebSocket connection to signaling server
 *
 * FIXED:
 * - emit() correctly handles callback-only events
 * - on()/off() now buffer listeners if socket doesn't exist yet
 *   and applies them when connect() is called
 * - Transport: polling + websocket upgrade for stability
 */

import { io, Socket } from 'socket.io-client';
import { SERVER_URL } from '../constants';

type ListenerEntry = { event: string; callback: (...args: any[]) => void };

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;
  // Buffer listeners registered before connect()
  private pendingListeners: ListenerEntry[] = [];

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to signaling server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected:', this.socket.id);
      return this.socket;
    }

    console.log('[SocketService] Connecting to:', SERVER_URL);

    this.socket = io(SERVER_URL, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      forceNew: false,
    });

    // Apply any buffered listeners
    if (this.pendingListeners.length > 0) {
      console.log(`[SocketService] Applying ${this.pendingListeners.length} buffered listeners`);
      for (const { event, callback } of this.pendingListeners) {
        this.socket.on(event, callback);
      }
      this.pendingListeners = [];
    }

    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected! Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] ❌ Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] ❌ Connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('[SocketService] 🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('[SocketService] 🔄 Reconnection attempt:', attemptNumber);
    });

    return this.socket;
  }

  /**
   * Get the current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event with proper argument handling
   */
  emit(event: string, data?: any, callback?: (response: any) => void): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] ⚠️ Cannot emit', event, '- not connected');
      return;
    }

    console.log('[SocketService] 📤 Emit:', event, data !== undefined ? JSON.stringify(data).slice(0, 100) : '(no data)');

    if (callback && data !== undefined) {
      this.socket.emit(event, data, callback);
    } else if (callback && data === undefined) {
      this.socket.emit(event, callback);
    } else if (data !== undefined) {
      this.socket.emit(event, data);
    } else {
      this.socket.emit(event);
    }
  }

  /**
   * Listen to an event.
   * If socket doesn't exist yet, buffers the listener and applies on connect().
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Buffer for later
      console.log('[SocketService] 📦 Buffering listener for:', event);
      this.pendingListeners.push({ event, callback });
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
    // Also remove from pending buffer if present
    if (callback) {
      this.pendingListeners = this.pendingListeners.filter(
        (l) => !(l.event === event && l.callback === callback)
      );
    } else {
      this.pendingListeners = this.pendingListeners.filter(
        (l) => l.event !== event
      );
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Disconnected and cleaned up');
    }
  }
}

export default SocketService.getInstance();
