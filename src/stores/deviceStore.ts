// src/stores/deviceStore.ts — FCM-токен устройства
import {create} from 'zustand';
import {updateDeviceToken} from '../api/device';

interface DeviceState {
  fcmToken: string | null;
  isSending: boolean;
  error: string | null;

  registerToken: (token: string) => Promise<boolean>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  fcmToken: null,
  isSending: false,
  error: null,

  registerToken: async (token) => {
    set({isSending: true, error: null, fcmToken: token});
    try {
      await updateDeviceToken({fcm_token: token});
      return true;
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка регистрации токена'});
      return false;
    } finally {
      set({isSending: false});
    }
  },
}));
