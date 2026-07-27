// src/types/device.ts — устройство и FCM

/** Тело запроса на сохранение FCM-токена (PATCH /api/v1/device) */
export interface DeviceTokenDTO {
    fcm_token: string;
}
