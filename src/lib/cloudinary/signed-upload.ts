import { createHash } from "node:crypto";

import { ApiError } from "@/src/lib/api/errors";

export const DONATION_IMAGE_FOLDER = "donapp/donaciones";
export const DONATION_IMAGE_FORMATS = "jpg,jpeg,png,webp";

export interface SignedImageUpload {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: typeof DONATION_IMAGE_FOLDER;
  allowedFormats: typeof DONATION_IMAGE_FORMATS;
}

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ApiError(
      500,
      "El servicio de imágenes no está configurado.",
      "internal",
    );
  }

  return value;
}

function validCloudName(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/u.test(value);
}

export function createSignedImageUpload(now = new Date()): SignedImageUpload {
  const cloudName = requiredEnvironmentValue("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnvironmentValue("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnvironmentValue("CLOUDINARY_API_SECRET");

  if (!validCloudName(cloudName)) {
    throw new ApiError(
      500,
      "El servicio de imágenes no está configurado.",
      "internal",
    );
  }

  const timestamp = Math.floor(now.getTime() / 1000);
  const parameters =
    `allowed_formats=${DONATION_IMAGE_FORMATS}` +
    `&folder=${DONATION_IMAGE_FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(`${parameters}${apiSecret}`, "utf8")
    .digest("hex");

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    timestamp,
    signature,
    folder: DONATION_IMAGE_FOLDER,
    allowedFormats: DONATION_IMAGE_FORMATS,
  };
}
