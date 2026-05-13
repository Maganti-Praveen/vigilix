/**
 * usePermissions Hook
 * Handles runtime permission requests for camera and microphone
 */

import { useState, useEffect, useCallback } from 'react';
import { requestCameraPermissions, requestStoragePermissions } from '../utils/permissions';

interface PermissionState {
  camera: boolean;
  storage: boolean;
  allGranted: boolean;
  isChecking: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: false,
    storage: false,
    allGranted: false,
    isChecking: true,
  });

  const checkPermissions = useCallback(async () => {
    setPermissions((prev) => ({ ...prev, isChecking: true }));

    const camera = await requestCameraPermissions();
    const storage = await requestStoragePermissions();

    setPermissions({
      camera,
      storage,
      allGranted: camera,  // Camera + mic is the minimum
      isChecking: false,
    });

    return camera;
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return { ...permissions, recheckPermissions: checkPermissions };
}
