// backend/api/src/config/r2.js

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// 🧠 Cliente R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

/**
 * Upload de arquivo para Cloudflare R2
 */
export const uploadToR2 = async (file) => {
  try {
    const fileName = `avatar-${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await r2Client.send(command);

    // ⚠️ IMPORTANTE: URL pública do R2
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return publicUrl;

  } catch (error) {
    console.error('Erro no upload R2:', error);
    throw new Error('Falha ao enviar arquivo');
  }
};