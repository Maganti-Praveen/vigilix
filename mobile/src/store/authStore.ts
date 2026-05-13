/**
 * Auth Store (Zustand)
 * Handles user authentication state, token persistence, and device registration
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiService from '../services/apiService';

const TOKEN_KEY = 'vigilix_auth_token';
const USER_KEY = 'vigilix_user';

export interface User {
  _id: string;
  email: string;
  name: string;
  devices?: Device[];
  createdAt?: string;
}

export interface Device {
  _id: string;
  userId: string;
  deviceName: string;
  deviceModel: string;
  role: 'camera' | 'viewer';
  roomCode?: string;
  isOnline: boolean;
  lastSeen: string;
  lastBatteryLevel?: number;
  lastBatteryCharging?: boolean;
  fcmToken?: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  devices: Device[];
  currentDevice: Device | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerDevice: (deviceName: string, deviceModel: string, role: 'camera' | 'viewer') => Promise<Device | null>;
  loadDevices: () => Promise<void>;
  setCurrentDevice: (device: Device | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  devices: [],
  currentDevice: null,
  error: null,

  /**
   * Initialize auth state from secure storage
   * Called on app launch
   */
  initialize: async () => {
    try {
      set({ isLoading: true });

      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        apiService.setToken(token);

        // Verify token is still valid
        try {
          const response = await apiService.getMe();
          set({
            user: response.user,
            token,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });

          // Load devices
          await get().loadDevices();
        } catch {
          // Token expired — clear and show login
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
          apiService.setToken(null);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      } else {
        set({ isInitialized: true, isLoading: false });
      }
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  /**
   * Register a new account
   */
  register: async (name, email, password) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.register(name, email, password);

      // Save token and user
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
      apiService.setToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  /**
   * Login with email and password
   */
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.login(email, password);

      // Save token and user
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));
      apiService.setToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Load devices
      await get().loadDevices();

      return true;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return false;
    }
  },

  /**
   * Logout — clear all auth state
   */
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    apiService.setToken(null);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      devices: [],
      currentDevice: null,
      error: null,
    });
  },

  /**
   * Register current phone as a device
   */
  registerDevice: async (deviceName, deviceModel, role) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiService.registerDevice(deviceName, deviceModel, role);

      const device = response.device;
      set((state) => ({
        devices: [...state.devices, device],
        currentDevice: device,
        isLoading: false,
      }));

      return device;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  /**
   * Load all devices for the user
   */
  loadDevices: async () => {
    try {
      const response = await apiService.getDevices();
      set({ devices: response.devices || [] });
    } catch (error) {
      console.warn('[AuthStore] Failed to load devices:', error);
    }
  },

  setCurrentDevice: (device) => set({ currentDevice: device }),
  clearError: () => set({ error: null }),
}));
