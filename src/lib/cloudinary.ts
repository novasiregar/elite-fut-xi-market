import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

export interface UploadResult {
  url:      string;
  publicId: string;
  width:    number;
  height:   number;
  format:   string;
  bytes:    number;
}

/**
 * Upload image to Cloudinary.
 * Automatically converts to WebP and resizes for optimization.
 */
export async function uploadImage(
  file: string | Buffer,
  folder: string,
  options?: {
    width?:       number;
    height?:      number;
    publicId?:    string;
  }
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder:          `elite-fut-xi/${folder}`,
      resource_type:   'image',
      format:          'webp',
      transformation: [
        {
          width:   options?.width  ?? 1200,
          height:  options?.height ?? 900,
          crop:    'limit',
          quality: 'auto:good',
          fetch_format: 'webp',
        },
      ],
      ...(options?.publicId ? { public_id: options.publicId } : {}),
    }
  );

  return {
    url:      result.secure_url,
    publicId: result.public_id,
    width:    result.width,
    height:   result.height,
    format:   result.format,
    bytes:    result.bytes,
  };
}

/**
 * Upload KYC documents (private, higher quality).
 */
export async function uploadDocument(
  file: string,
  userId: string,
  docType: 'identity' | 'selfie'
): Promise<UploadResult> {
  return uploadImage(file, `kyc/${userId}`, {
    width: 2000,
    height: 2000,
    publicId: `${docType}_${Date.now()}`,
  });
}

/**
 * Delete an image from Cloudinary.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
