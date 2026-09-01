// src/services/location-service.ts
import * as Location from 'expo-location';

const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || process.env.TOMTOM_API_KEY || 'BHEiGUcbB06ofsGybuUFTFReGMYYkoy9';

export type Coordinates = [number, number]; // [latitude, longitude]

export interface AddressSuggestion {
    id: string;
    label: string;
    fullAddress: string;
    coordinates: Coordinates;
}

/**
 * Определяет текстовый адрес по координатам [lat, lng].
 */
export async function getAddressFromCoordinates(
    lat: number | null,
    lng: number | null
): Promise<string> {
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        return '';
    }

    // ПОПЫТКА 1: Встроенный модуль устройства (expo-location)
    try {
        const geocoded = await Location.reverseGeocodeAsync({latitude: lat, longitude: lng});
        if (geocoded && geocoded.length > 0) {
            const item = geocoded[0];
            const formatted = [item.city || item.region, item.street, item.name]
                .filter(Boolean)
                .join(', ');

            if (formatted) {
                return formatted;
            }
        }
    } catch (_err) {
        console.warn('Expo location reverse geocode failed, falling back to TomTom');
    }

    // ПОПЫТКА 2 (Фоллбэк): Запрос к TomTom API
    try {
        const response = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_API_KEY}&language=ru-RU`
        );
        if (response.ok) {
            const data = await response.json();
            const freeformAddress = data.addresses?.[0]?.address?.freeformAddress;
            if (freeformAddress) {
                return freeformAddress;
            }
        }
    } catch (_tomTomErr) {
        console.warn('TomTom reverse geocode also failed');
    }

    // ПОПЫТКА 3: Вывод координат в текстовом виде
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Поиск подсказок адресов через TomTom Search API
 */
export async function fetchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
    const text = query.trim();
    if (!text || text.length < 2) {
        return [];
    }

    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(text)}.json?key=${TOMTOM_API_KEY}&language=ru-RU&typeahead=true&limit=6`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('TomTom request failed');
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    return results
        .map((item: any, index: number) => {
            const address = item.address || {};
            const label =
                address.freeformAddress ||
                address.streetName ||
                address.municipality ||
                address.country ||
                item.poi?.name ||
                item.name ||
                'Адрес';

            const position = item.position;
            if (!label || !position || typeof position.lat !== 'number' || typeof position.lon !== 'number') {
                return null;
            }

            return {
                id: `${item.id || item.type || 'suggestion'}-${index}`,
                label,
                fullAddress: label,
                coordinates: [position.lat, position.lon] as Coordinates,
            } as AddressSuggestion;
        })
        .filter((item: AddressSuggestion | null): item is AddressSuggestion => Boolean(item));
}

/**
 * Генерирует URL статического изображения карты TomTom по координатам.
 */
export function getStaticMapUrl(lat: number | null, lng: number | null): string {
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        throw new Error('Координаты события отсутствуют');
    }

    return `https://api.tomtom.com/map/1/staticimage?layer=basic&style=main&zoom=15&width=700&height=400&center=${lng},${lat}&format=png&key=${TOMTOM_API_KEY}&pois=${lng},${lat}`;
}

/**
 * Запрашивает разрешения и возвращает текущие координаты устройства [lat, lng].
 * Возвращает null, если разрешение не получено.
 */
export async function getCurrentCoordinates(): Promise<Coordinates | null> {
    const {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        return null;
    }

    const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
    });

    return [position.coords.latitude, position.coords.longitude];
}