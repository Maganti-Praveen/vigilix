import { NativeModules, Platform } from 'react-native';

const { StreamingService } = NativeModules;

/**
 * Hardware Service — provides native Android hardware controls:
 * 1. Physical Torch/Flashlight LED
 * 2. Audio Loudspeaker routing (forces sound through main media speaker at MAX volume)
 */
class HardwareService {
  /**
   * Toggle the physical camera LED torch/flashlight
   */
  async setTorch(enabled: boolean): Promise<boolean> {
    if (Platform.OS !== 'android' || !StreamingService?.setTorch) {
      console.warn('[HardwareService] setTorch not available on this platform');
      return false;
    }
    try {
      const ok = await StreamingService.setTorch(enabled);
      console.log(`[HardwareService] Physical torch ${enabled ? 'ENGAGED' : 'DISENGAGED'}`);
      return Boolean(ok);
    } catch (error: any) {
      console.error('[HardwareService] setTorch error:', error.message);
      return false;
    }
  }

  /**
   * Check if physical flashlight is supported
   */
  async isTorchSupported(): Promise<boolean> {
    if (Platform.OS !== 'android' || !StreamingService?.isTorchSupported) {
      return false;
    }
    try {
      return await StreamingService.isTorchSupported();
    } catch {
      return false;
    }
  }

  /**
   * Force Android to route WebRTC audio out of the primary LOUDSPEAKER (bottom speaker)
   * and maximize volume so talk-back audio projects loudly like YouTube.
   */
  async setSpeakerphone(enabled: boolean = true): Promise<boolean> {
    if (Platform.OS !== 'android' || !StreamingService?.setSpeakerphone) {
      console.warn('[HardwareService] setSpeakerphone not available on this platform');
      return false;
    }
    try {
      await StreamingService.setSpeakerphone(enabled);
      console.log(`[HardwareService] Loudspeaker mode set to: ${enabled}`);
      return true;
    } catch (error: any) {
      console.error('[HardwareService] setSpeakerphone error:', error.message);
      return false;
    }
  }
}

export default new HardwareService();
