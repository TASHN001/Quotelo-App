import { supabase } from './supabase';

const BUCKET_NAME = 'business-assets';

export const storage = {
  async uploadLogo(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('[Storage] Starting logo upload', { fileName: file.name, fileSize: file.size, userId });

      if (!file || file.size === 0) {
        const error = 'Invalid file selected';
        console.error('[Storage] Upload failed:', error);
        return { url: null, error };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;

      console.log('[Storage] Uploading to path:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[Storage] Upload error:', uploadError);
        return {
          url: null,
          error: `Upload failed: ${uploadError.message || 'Unknown error'}`
        };
      }

      if (!data || !data.path) {
        console.error('[Storage] No path returned from upload');
        return { url: null, error: 'Upload failed: No path returned' };
      }

      console.log('[Storage] Upload successful, getting public URL for:', data.path);

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!urlData || !urlData.publicUrl) {
        console.error('[Storage] Failed to get public URL');
        return { url: null, error: 'Failed to get file URL' };
      }

      console.log('[Storage] Public URL generated:', urlData.publicUrl);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('[Storage] Unexpected error in uploadLogo:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Unexpected error during upload'
      };
    }
  },

  async checkStorageAvailable(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error('[Storage] Storage check failed:', error);
        return false;
      }
      const bucketExists = data?.some(b => b.name === BUCKET_NAME);
      console.log('[Storage] Storage available:', bucketExists);
      return bucketExists || false;
    } catch (error) {
      console.error('[Storage] Storage check error:', error);
      return false;
    }
  },

  async uploadPDF(
    pdfBlob: Blob,
    filename: string,
    userId: string
  ): Promise<{ url: string | null; path: string | null; error: string | null }> {
    try {
      console.log('[Storage] Starting PDF upload', { filename, userId });

      const filePath = `${userId}/invoices/${filename}`;

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[Storage] PDF upload error:', uploadError);
        return {
          url: null,
          path: null,
          error: `Upload failed: ${uploadError.message || 'Unknown error'}`
        };
      }

      if (!data || !data.path) {
        console.error('[Storage] No path returned from PDF upload');
        return { url: null, path: null, error: 'Upload failed: No path returned' };
      }

      console.log('[Storage] PDF upload successful:', data.path);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 900);

      if (signedUrlError || !signedUrlData) {
        console.error('[Storage] Failed to create signed URL:', signedUrlError);
        return { url: null, path: data.path, error: 'Failed to create download link' };
      }

      console.log('[Storage] Signed URL created');

      return { url: signedUrlData.signedUrl, path: data.path, error: null };
    } catch (error) {
      console.error('[Storage] Unexpected error in uploadPDF:', error);
      return {
        url: null,
        path: null,
        error: error instanceof Error ? error.message : 'Unexpected error during upload'
      };
    }
  },

  async getSignedUrl(filePath: string, expiresIn: number = 900): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn);

      if (error || !data) {
        console.error('[Storage] Failed to create signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('[Storage] Error creating signed URL:', error);
      return null;
    }
  }
};
