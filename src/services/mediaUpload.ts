import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { env } from "../config/env";
import { apiClient } from "./apiClient";
import uploadUrlFixture from "./mockApi/fixtures/uploadUrl.json";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

export async function compressImage(uri: string, width: number, height: number) {
  let context = ImageManipulator.manipulate(uri);

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    context = width >= height ? context.resize({ width: MAX_DIMENSION }) : context.resize({ height: MAX_DIMENSION });
  }

  const image = await context.renderAsync();
  return image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });
}

type UploadUrlResponse = {
  uploadUrl: string;
  mediaUrl: string;
};

async function requestUploadUrl(filename: string, contentType: string): Promise<UploadUrlResponse> {
  if (env.USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return uploadUrlFixture;
  }
  const response = await apiClient.post<UploadUrlResponse>("/v1/media/upload-url", { filename, contentType });
  return response.data;
}

async function putToUploadUrl(uploadUrl: string, uri: string, contentType: string): Promise<void> {
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();
  await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
}

/**
 * Requests a fresh presigned URL every call - a previously issued one may have
 * expired (5 min TTL) and must not be reused across retries (SRS 3.1.15).
 */
export async function uploadIncidentPhoto(compressedUri: string): Promise<string> {
  const filename = `incident-${Date.now()}.jpg`;
  const contentType = "image/jpeg";
  const { uploadUrl, mediaUrl } = await requestUploadUrl(filename, contentType);

  if (!env.USE_MOCK_API) {
    await putToUploadUrl(uploadUrl, compressedUri, contentType);
  }

  return mediaUrl;
}
