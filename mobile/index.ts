import { registerRootComponent } from 'expo';
import App from './App';

// Register top-level background message handler for Firebase Cloud Messaging
try {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('[FCM] Background message handled in index.ts:', remoteMessage?.data);
  });
} catch {
  // @react-native-firebase/messaging may not be linked or available in some environments
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
