// src/api/device.ts — FCM-токен устройства
import {apiClient} from './client';
import type {DeviceTokenDTO, SuccessResponse} from '../types';

/** PATCH /api/v1/device — сохранить/обновить FCM-токен */
export function updateDeviceToken(dto: DeviceTokenDTO): Promise<SuccessResponse> {
  return apiClient.patch<SuccessResponse>('/device', dto).then((r) => r.data);
}
