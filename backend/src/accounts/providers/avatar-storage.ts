import { BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { constants } from "node:fs";
import { mkdir, lstat, open, readdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface StoredAvatar {key: string; lastModified: Date}
export interface AvatarStorage {
  readonly available: boolean;
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** Operator-only lexical enumeration; caller bounds scans, checks age and DB references. */
  list?(afterKey?: string): AsyncIterable<StoredAvatar>;
}
type StorageCommand = PutObjectCommand | GetObjectCommand | DeleteObjectCommand | ListObjectsV2Command;
export type S3Execute = (command: StorageCommand, signal: AbortSignal) => Promise<unknown>;
export const avatarKeyPattern = /^avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;
export function assertAvatarKey(key: string): void {
  if (typeof key !== "string" || !avatarKeyPattern.test(key) || /[\r\n]/.test(key)) throw new BadRequestException({field: "avatar"});
}
const unavailable = () => new ServiceUnavailableException({code: "AVATAR_STORAGE_UNAVAILABLE"});
const missing = () => new ServiceUnavailableException({code: "INTEGRATION_NOT_CONFIGURED"});

export class DisabledAvatarStorage implements AvatarStorage {
  readonly available = false;
  async put(): Promise<void> { throw missing(); }
  async get(): Promise<Buffer> { throw missing(); }
  async delete(): Promise<void> { throw missing(); }
}

export class LocalAvatarStorage implements AvatarStorage {
  readonly available = true;
  readonly directory: string;
  constructor(directory: string) { this.directory = resolve(directory); }
  private async parent(key: string, create: boolean) {
    assertAvatarKey(key);
    const [prefix, owner] = key.split("/");
    if (create) await mkdir(this.directory, {recursive: true, mode: 0o700});
    for (const directory of [join(this.directory, prefix), join(this.directory, prefix, owner)]) {
      if (create) await mkdir(directory, {mode: 0o700}).catch(error => {if (error.code !== "EEXIST") throw error;});
      const info = await lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink()) throw unavailable();
    }
    return join(this.directory, key);
  }
  async put(key: string, bytes: Buffer) {
    assertAvatarKey(key);
    try {
      const file = await this.parent(key, true);
      const handle = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
      try { await handle.writeFile(bytes); } finally { await handle.close(); }
    } catch { throw unavailable(); }
  }
  async get(key: string) {
    assertAvatarKey(key);
    try {
      const file = await this.parent(key, false);
      const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        const info = await handle.stat();
        if (!info.isFile() || info.size > 2 * 1024 * 1024) throw unavailable();
        return await handle.readFile();
      } finally { await handle.close(); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new NotFoundException();
      throw unavailable();
    }
  }
  async delete(key: string) {
    assertAvatarKey(key);
    try { await unlink(await this.parent(key, false)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw unavailable(); }
  }
  async *list(afterKey?: string) {
    if (afterKey !== undefined) assertAvatarKey(afterKey);
    const root = join(this.directory, "avatars");
    let owners;
    try { owners = await readdir(root, {withFileTypes: true}); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw unavailable(); }
    for (const owner of owners.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (!owner.isDirectory() || owner.isSymbolicLink()) continue;
      const directory = join(root, owner.name);
      const files = await readdir(directory, {withFileTypes: true});
      for (const file of files.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
        const key = `avatars/${owner.name}/${file.name}`;
        if (!file.isFile() || file.isSymbolicLink() || !avatarKeyPattern.test(key) || (afterKey !== undefined && key <= afterKey)) continue;
        const info = await lstat(join(root, owner.name, file.name));
        if (info.isFile() && !info.isSymbolicLink()) yield {key, lastModified: info.mtime};
      }
    }
  }
}

export class S3AvatarStorage implements AvatarStorage {
  readonly available = true;
  constructor(readonly bucket: string, private readonly execute: S3Execute) {}
  private async send(command: StorageCommand) {
    try { return await this.execute(command, AbortSignal.timeout(8_000)); }
    catch (error) {
      if ((error as {name?: string}).name === "NoSuchKey") throw new NotFoundException();
      throw unavailable();
    }
  }
  async put(key: string, bytes: Buffer) {
    assertAvatarKey(key);
    await this.send(new PutObjectCommand({Bucket: this.bucket, Key: key, Body: bytes, ContentType: "image/webp", CacheControl: "private, no-store", ServerSideEncryption: "AES256", IfNoneMatch: "*"}));
  }
  async get(key: string) {
    assertAvatarKey(key);
    const result = await this.send(new GetObjectCommand({Bucket: this.bucket, Key: key})) as {ContentLength?: number; Body?: {transformToByteArray(): Promise<Uint8Array>}};
    if (!result?.Body || (result.ContentLength ?? 0) > 2 * 1024 * 1024) throw unavailable();
    try {
      const bytes = Buffer.from(await result.Body.transformToByteArray());
      if (bytes.length > 2 * 1024 * 1024) throw unavailable();
      return bytes;
    } catch { throw unavailable(); }
  }
  async delete(key: string) {
    assertAvatarKey(key);
    await this.send(new DeleteObjectCommand({Bucket: this.bucket, Key: key}));
  }
  async *list(afterKey?: string) {
    if (afterKey !== undefined) assertAvatarKey(afterKey);
    let cursor: string | undefined;
    do {
      const result = await this.send(new ListObjectsV2Command({Bucket: this.bucket, Prefix: "avatars/", MaxKeys: 100, StartAfter: afterKey, ContinuationToken: cursor})) as {
        Contents?: {Key?: string; LastModified?: Date}[]; IsTruncated?: boolean; NextContinuationToken?: string;
      };
      for (const object of result.Contents ?? []) {
        if (object.Key && avatarKeyPattern.test(object.Key) && object.LastModified && (afterKey === undefined || object.Key > afterKey)) {
          yield {key: object.Key, lastModified: object.LastModified};
        }
      }
      const next = result.IsTruncated ? result.NextContinuationToken : undefined;
      if (result.IsTruncated && (!next || next === cursor)) throw unavailable();
      cursor = next;
    } while (cursor);
  }
}

export function createAvatarStorage(env: NodeJS.ProcessEnv = process.env, options: {execute?: S3Execute} = {}): AvatarStorage {
  const driver = env.AVATAR_STORAGE_DRIVER ?? (env.NODE_ENV === "production" ? "disabled" : "local");
  if (driver === "local" && env.NODE_ENV !== "production") return new LocalAvatarStorage(env.AVATAR_LOCAL_DIR || join(process.cwd(), ".data"));
  if (driver !== "s3" || !env.AWS_REGION || !env.S3_AVATAR_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) return new DisabledAvatarStorage();
  const client = options.execute ? undefined : new S3Client({region: env.AWS_REGION, maxAttempts: 1, credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, sessionToken: env.AWS_SESSION_TOKEN || undefined,
  }});
  const execute: S3Execute = options.execute ?? (async (command, signal) => {
    const config = {abortSignal: signal};
    if (command instanceof PutObjectCommand) return client!.send(command, config);
    if (command instanceof GetObjectCommand) return client!.send(command, config);
    if (command instanceof DeleteObjectCommand) return client!.send(command, config);
    return client!.send(command, config);
  });
  return new S3AvatarStorage(env.S3_AVATAR_BUCKET, execute);
}
