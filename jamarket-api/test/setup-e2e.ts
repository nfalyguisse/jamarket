import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../.env.test'), override: true });

// Valeurs factices pour le boot Nest (CloudinaryService.onModuleInit)
process.env.CLOUDINARY_CLOUD_NAME ??= 'test_cloud';
process.env.CLOUDINARY_API_KEY ??= 'test_key';
process.env.CLOUDINARY_API_SECRET ??= 'test_secret';
