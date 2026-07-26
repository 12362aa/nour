import { Platform, Linking } from "react-native";
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';

export async function isBatteryOptimizationActive(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  // Fallback to true if we want to ensure they see it, but let's just use the manual trigger from settings for now.
  // Notifee is removed from core notification logic, so we just assume it's needed if the user opens the modal.
  return false;
}

export function isXiaomiDevice(): boolean {
  return Platform.OS === 'android' && (Device.manufacturer?.toLowerCase() === 'xiaomi' || Device.brand?.toLowerCase() === 'xiaomi' || Device.brand?.toLowerCase() === 'poco' || Device.brand?.toLowerCase() === 'redmi');
}

export async function requestIgnoreBatteryOptimization(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
  } catch (error) {
    console.error("[nour:battery] Failed to open battery settings", error);
    Linking.openSettings().catch(() => undefined);
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
  } catch (error) {
    console.error("[nour:battery] Failed to open exact alarm settings", error);
    Linking.openSettings().catch(() => undefined);
  }
}

export async function openXiaomiAutostartSettings(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await IntentLauncher.startActivityAsync('miui.intent.action.OP_AUTO_START');
  } catch (e1) {
    try {
      await IntentLauncher.startActivityAsync('com.miui.securitycenter', {
        className: 'com.miui.permcenter.autostart.AutoStartManagementActivity',
      });
    } catch (e2) {
      console.warn("Could not open Xiaomi autostart directly, opening standard settings.");
      Linking.openSettings().catch(() => undefined);
    }
  }
}
