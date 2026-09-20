import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { apiClient } from "./apiClient";
import { UploadError } from "./uploadError";

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
  const fileBlob = await fileResponse.blob();
  // Re-wrapped with the type pinned. On Android, React Native sends a Blob body
  // with the *Blob's own* `type`, silently overriding the Content-Type header set
  // below (BlobModule.toRequestBody). A blob read back from a file:// URI carries
  // whatever type the file layer reports, and the presigned URL's signature covers
  // Content-Type exactly — so any difference is a 403 SignatureDoesNotMatch, and the
  // upload, and with it every report, failed on the device while a curl PUT with the
  // right header succeeded.
  const blob = new Blob([fileBlob], { type: contentType });

  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  } catch {
    throw new UploadError("Couldn't reach the photo storage server.", null);
  }

  // Without this check a 403 (expired or mismatched signature) or 404 resolved
  // as success, and the incident was then POSTed with a mediaUrl pointing at an
  // object that was never written.
  if (!response.ok) {
    // S3/MinIO explain a refusal in an XML body (<Code>SignatureDoesNotMatch</Code>);
    // a bare "403" is otherwise undiagnosable, since one status covers a wrong
    // Content-Type, a clock problem and an expired URL alike.
    const code = (await response.text().catch(() => "")).match(/<Code>([^<]+)<\/Code>/)?.[1];
    throw new UploadError(
      `Photo upload was rejected (${response.status}${code ? ` ${code}` : ""}).`,
      response.status,
    );
  }
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
