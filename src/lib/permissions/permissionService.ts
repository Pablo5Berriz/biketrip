import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import type { ServiceResult } from '@/types/database';

// ============================================================
// Service de gestion des permissions iOS/Android
// ============================================================

/**
 * Demander la permission de localisation (utilisation)
 */
export async function requestLocationPermission(): Promise<ServiceResult<boolean>> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return { success: true, data: true };
    return {
      success: false,
      error: 'Permission de localisation refusée. Activer dans les paramètres de l\'appareil.',
      data: false,
    };
  } catch {
    return { success: false, error: 'Impossible de demander la permission.' };
  }
}

/**
 * Demander la permission de localisation en arrière-plan (sortie active)
 */
export async function requestBackgroundLocationPermission(): Promise<ServiceResult<boolean>> {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      return { success: false, error: 'Permission de localisation requise d\'abord.' };
    }
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') return { success: true, data: true };
    return {
      success: false,
      error: 'Permission arrière-plan refusée. Sélectionne "Toujours" dans les paramètres.',
      data: false,
    };
  } catch {
    return { success: false, error: 'Impossible de demander la permission.' };
  }
}

/**
 * Vérifier si la localisation est disponible
 */
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Demander la permission d'accès à la galerie
 */
export async function requestMediaLibraryPermission(): Promise<ServiceResult<boolean>> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') return { success: true, data: true };
    return {
      success: false,
      error: 'Accès à la galerie refusé. Activer dans les paramètres.',
      data: false,
    };
  } catch {
    return { success: false, error: 'Impossible de demander la permission.' };
  }
}

/**
 * Demander la permission d'accès à la caméra
 */
export async function requestCameraPermission(): Promise<ServiceResult<boolean>> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') return { success: true, data: true };
    return {
      success: false,
      error: 'Accès à l\'appareil photo refusé. Activer dans les paramètres.',
      data: false,
    };
  } catch {
    return { success: false, error: 'Impossible de demander la permission.' };
  }
}

/**
 * Demander la permission de notifications push
 */
export async function requestNotificationPermission(): Promise<ServiceResult<boolean>> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return { success: true, data: true };

    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') return { success: true, data: true };
    return {
      success: false,
      error: 'Notifications refusées. Tu peux les activer dans les paramètres.',
      data: false,
    };
  } catch {
    return { success: false, error: 'Impossible de demander la permission.' };
  }
}

/**
 * Ouvrir une image depuis la galerie
 */
export async function pickImageFromLibrary(): Promise<ServiceResult<string>> {
  const permResult = await requestMediaLibraryPermission();
  if (!permResult.success) return { success: false, error: permResult.error };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (result.canceled) return { success: false, error: 'Sélection annulée.' };
    const uri = result.assets[0]?.uri;
    if (!uri) return { success: false, error: 'Impossible de récupérer l\'image.' };
    return { success: true, data: uri };
  } catch {
    return { success: false, error: 'Erreur lors de l\'ouverture de la galerie.' };
  }
}

/**
 * Prendre une photo avec l'appareil photo
 */
export async function takePhoto(): Promise<ServiceResult<string>> {
  const permResult = await requestCameraPermission();
  if (!permResult.success) return { success: false, error: permResult.error };

  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (result.canceled) return { success: false, error: 'Photo annulée.' };
    const uri = result.assets[0]?.uri;
    if (!uri) return { success: false, error: 'Impossible de récupérer la photo.' };
    return { success: true, data: uri };
  } catch {
    return { success: false, error: 'Erreur lors de la prise de photo.' };
  }
}
