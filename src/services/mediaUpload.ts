import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { apiClient } from "./apiClient";

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
  const response = await apiClient.post<UploadUrlResponse>("/media/upload-url", { filename, contentType });
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
 * Shared by incident photos (§3.1.15) and task completion evidence (§3.1.16) —
 * both go through the same presigned-S3 flow, just with a different filename
 * prefix so objects from each are easy to tell apart in the bucket.
 */
async function uploadPhoto(compressedUri: string, filenamePrefix: string): Promise<string> {
  const filename = `${filenamePrefix}-${Date.now()}.jpg`;
  const contentType = "image/jpeg";
  const { uploadUrl, mediaUrl } = await requestUploadUrl(filename, contentType);

  await putToUploadUrl(uploadUrl, compressedUri, contentType);

  return mediaUrl;
}

export function uploadIncidentPhoto(compressedUri: string): Promise<string> {
  return uploadPhoto(compressedUri, "incident");
}

export function uploadTaskEvidencePhoto(compressedUri: string): Promise<string> {
  return uploadPhoto(compressedUri, "task-evidence");
}
