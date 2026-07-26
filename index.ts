import { registerRootComponent } from "expo";
import App from "./App";
import { registerNotifeeBackgroundHandler } from "./src/services/fullScreenNotifications";
import { setupFCMBackgroundHandler } from "./src/services/fcm";

// Must be registered before the React tree so Stop / Snooze / Logged actions
// work when Android starts the app from a background or killed state.
registerNotifeeBackgroundHandler();

// Register FCM background handler so Android can receive push notifications
// even when the app is completely closed/killed.
setupFCMBackgroundHandler();

registerRootComponent(App);
