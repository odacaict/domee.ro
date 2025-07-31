import { supabase } from '../lib/supabase';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../utils/constants';

export const uploadService = {
  async uploadImage(file: File, bucket: string, path: string): Promise<string> {
    // Validate file
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Tip de fișier invalid. Doar JPEG, PNG și WebP sunt acceptate.');
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      throw new Error(`Fișierul nu poate depăși ${MAX_IMAGE_SIZE_MB}MB`);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteImage(url: string, bucket: string): Promise<void> {
    // Extract path from URL
    const urlParts = url.split('/');
    const path = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  async uploadMultipleImages(files: File[], bucket: string, path: string): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, bucket, path));
    return Promise.all(uploadPromises);
  },

  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Tip de fișier invalid' };
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return { valid: false, error: `Fișierul depășește ${MAX_IMAGE_SIZE_MB}MB` };
    }

    return { valid: true };
  },

  async uploadLogo(file: File, providerId: string): Promise<string> {
    return this.uploadImage(file, 'logos', providerId);
  },

  async uploadGalleryImage(file: File, providerId: string): Promise<string> {
    return this.uploadImage(file, 'gallery', providerId);
  },

  async uploadServiceImage(file: File, providerId: string, serviceId: string): Promise<string> {
    return this.uploadImage(file, 'services', `${providerId}/${serviceId}`);
  },

  async uploadProfileAvatar(file: File, userId: string): Promise<string> {
    return this.uploadImage(file, 'avatars', userId);
  },

  generateThumbnail(imageUrl: string, width: number = 300): string {
    // Pentru Supabase Storage, putem folosi transformări
    // Aceasta este o funcție placeholder - în producție ar trebui implementată
    // transformarea imaginilor prin Supabase sau un serviciu terț
    return imageUrl;
  }
};