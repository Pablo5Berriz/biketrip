import { supabase } from '@/lib/supabase/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ServiceResult } from '@/types/database';

// ============================================================
// Upload sécurisé d'images vers Supabase Storage
// ============================================================

const MAX_WIDTH = 1200;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type Bucket = 'avatars' | 'report-images' | 'ride-photos' | 'trail-covers';

/**
 * Compresse et upload une image
 */
export async function uploadImage(
  localUri: string,
  bucket: Bucket,
  userId: string,
  fileName?: string,
): Promise<ServiceResult<string>> {
  try {
    // 1. Compresser l'image
    const compressed = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    );

    // 2. Vérifier la taille
    const fileInfo = await FileSystem.getInfoAsync(compressed.uri);
    if (fileInfo.exists && 'size' in fileInfo && fileInfo.size > MAX_SIZE_BYTES) {
      return { success: false, error: 'Image trop volumineuse (max 5 MB).' };
    }

    // 3. Lire en base64
    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 4. Construire le chemin sécurisé
    const ext = 'jpg';
    const name = fileName ?? `${Date.now()}.${ext}`;
    const path = `${userId}/${name}`;

    // 5. Upload vers Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) return { success: false, error: 'Upload échoué. Réessaie.' };

    // 6. Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return { success: true, data: urlData.publicUrl };
  } catch {
    return { success: false, error: 'Erreur lors de l\'upload.' };
  }
}

/**
 * Supprimer une image du storage
 */
export async function deleteImage(bucket: Bucket, path: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return { success: false, error: 'Suppression impossible.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

// Decoder base64 → Uint8Array
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
