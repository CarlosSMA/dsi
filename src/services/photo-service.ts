import { getSupabase, photoBucket } from './supabase';

const SIGNED_URL_EXPIRATION_SECONDS = 60 * 60 * 24 * 365;

interface UploadPhotoParams {
  uri: string;
  userId: string;
  reportId: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface UploadedPhoto {
  path: string;
  url: string;
}

export async function uploadReportPhoto({
  uri,
  userId,
  reportId,
  fileName,
  mimeType,
}: UploadPhotoParams): Promise<UploadedPhoto> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Não foi possível ler a foto capturada.');
  }

  const file = await response.arrayBuffer();
  const extension = getFileExtension(fileName, mimeType);
  const path = `reports/${userId}/${reportId}/${Date.now()}${extension}`;

  const supabase = getSupabase();
  const { error: uploadError } = await supabase.storage.from(photoBucket).upload(path, file, {
    contentType: mimeType || 'image/jpeg',
    upsert: false,
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(photoBucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRATION_SECONDS);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    await removeReportPhoto(path);
    throw signedUrlError || new Error('Não foi possível gerar o endereço da foto.');
  }

  return { path, url: signedUrlData.signedUrl };
}

export async function removeReportPhoto(path: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(photoBucket).remove([path]);
  if (error) {
    console.error('Erro ao remover foto órfã do Supabase:', error);
  }
}

function getFileExtension(fileName?: string | null, mimeType?: string | null): string {
  const originalExtension = fileName?.match(/\.[a-z0-9]+$/i)?.[0];
  if (originalExtension) {
    return originalExtension.toLowerCase();
  }

  const mimeExtension = mimeType?.split('/')[1];
  return mimeExtension ? `.${mimeExtension.replace('jpeg', 'jpg')}` : '.jpg';
}
