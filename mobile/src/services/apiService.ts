import { SERVER_URL } from '../constants';

/**
 * API Service — handles all REST API calls to the Vigilix server
 * Auto-attaches JWT token to authenticated requests
 */
class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${SERVER_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Check your network.');
      }
      throw error;
    }
  }

  // ─── Auth ──────────────────────────────────────────────────

  async register(name: string, email: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  // ─── Devices ───────────────────────────────────────────────

  async registerDevice(deviceName: string, deviceModel: string, role: 'camera' | 'viewer', fcmToken?: string) {
    return this.request('/api/devices/register', {
      method: 'POST',
      body: JSON.stringify({ deviceName, deviceModel, role, fcmToken }),
    });
  }

  async getDevices() {
    return this.request('/api/devices');
  }

  async updateDeviceStatus(deviceId: string, status: {
    isOnline?: boolean;
    batteryLevel?: number;
    isCharging?: boolean;
    fcmToken?: string;
  }) {
    return this.request(`/api/devices/${deviceId}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  }

  async deleteDevice(deviceId: string) {
    return this.request(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  async wakeDevice(deviceId: string) {
    return this.request(`/api/devices/${deviceId}/wake`, {
      method: 'POST',
    });
  }

  // ─── Recordings ────────────────────────────────────────────

  async getRecordings(cameraDeviceId?: string, limit = 50, skip = 0) {
    const params = new URLSearchParams({ limit: String(limit), skip: String(skip) });
    if (cameraDeviceId) params.set('cameraDeviceId', cameraDeviceId);
    return this.request(`/api/recordings?${params}`);
  }

  async saveRecording(data: {
    cameraDeviceId: string;
    filename: string;
    filePath: string;
    fileSize: number;
    duration: number;
  }) {
    return this.request('/api/recordings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRecording(recordingId: string) {
    return this.request(`/api/recordings/${recordingId}`, {
      method: 'DELETE',
    });
  }

  // ─── Health ────────────────────────────────────────────────

  async checkHealth() {
    return this.request('/api/health');
  }
}

export default new ApiService();
