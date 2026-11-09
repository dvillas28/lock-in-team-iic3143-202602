import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from "@nestjs/common";
import sharp from "sharp";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_AVATAR_PIXELS = 16 * 1024 * 1024;

/** Decode the actual file; filenames and multipart MIME values confer no trust. */
export async function normalizeAvatar(bytes: Buffer): Promise<Buffer> {
  if (bytes.length > MAX_AVATAR_BYTES) throw new PayloadTooLargeException({field: "avatar"});
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
  if (!png && !jpeg && !webp) throw new UnsupportedMediaTypeException({field: "avatar"});
  try {
    // libpng builds may expose only the first APNG frame; reject its animation control chunk explicitly.
    if (png) {
      for (let offset = 8; offset + 12 <= bytes.length;) {
        const size = bytes.readUInt32BE(offset);
        if (size > bytes.length - offset - 12 || bytes.subarray(offset + 4, offset + 8).toString() === "acTL") throw new Error("Invalid PNG");
        offset += size + 12;
      }
    }
    const image = sharp(bytes, {limitInputPixels: MAX_AVATAR_PIXELS, animated: true, failOn: "error"});
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) !== 1 ||
        !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_AVATAR_PIXELS) {
      throw new Error("Invalid image");
    }
    return await image.rotate().resize({width: 1024, height: 1024, fit: "inside", withoutEnlargement: true})
      .webp({quality: 82}).toBuffer();
  } catch { throw new BadRequestException({field: "avatar"}); }
}
