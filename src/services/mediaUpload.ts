import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

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
