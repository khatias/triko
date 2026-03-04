import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import pLimit from "p-limit";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // keep private
const BUCKET = process.env.BUCKET;

const PREFIX = (process.env.PREFIX || "").replace(/^\/+/, "");
const BACKUP_PREFIX = (
  process.env.BACKUP_PREFIX || "__backup_originals/"
).replace(/^\/+/, "");
const DO_BACKUP =
  String(process.env.DO_BACKUP || "true").toLowerCase() === "true";

const MAX_WIDTH = Number(process.env.MAX_WIDTH || 1600);
const QUALITY = Number(process.env.QUALITY || 78);
const MIN_SIZE_KB = Number(process.env.MIN_SIZE_KB || 350);
const CONCURRENCY = Number(process.env.CONCURRENCY || 4);
const DRY_RUN = String(process.env.DRY_RUN || "true").toLowerCase() === "true";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !BUCKET) {
  console.error(
    "Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const limit = pLimit(CONCURRENCY);

function isJpeg(path) {
  return /\.(jpe?g)$/i.test(path);
}

function joinPath(a, b) {
  if (!a) return b;
  return a.endsWith("/") ? `${a}${b}` : `${a}/${b}`;
}

async function listFolderPaginated(prefix) {
  const out = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;

    out.push(...data);

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return out;
}

async function walk(prefix) {
  const items = await listFolderPaginated(prefix);
  const files = [];

  for (const item of items) {
    const fullPath = joinPath(prefix, item.name);

    // Folders have no metadata
    const isFolder = !item.metadata;
    if (isFolder) {
      const nested = await walk(fullPath);
      files.push(...nested);
      continue;
    }

    files.push({ ...item, fullPath });
  }

  return files;
}

async function download(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

async function upload(path, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "31536000",
  });
  if (error) throw error;
}

async function backupOriginal(path) {
  const backupPath = joinPath(BACKUP_PREFIX, path);
  const { error } = await supabase.storage.from(BUCKET).copy(path, backupPath);
  if (error) throw error;
}

async function processOne(obj) {
  const path = obj.fullPath;

  // ✅ only touch JPG/JPEG (skips PNG like watering.png automatically)
  if (!isJpeg(path)) return { path, status: "skip-non-jpeg" };

  const sizeBytes = obj.metadata?.size;
  if (typeof sizeBytes === "number" && sizeBytes < MIN_SIZE_KB * 1024) {
    return { path, status: "skip-small" };
  }

  if (DRY_RUN) return { path, status: "dry-run" };

  if (DO_BACKUP) await backupOriginal(path);

  const input = await download(path);

  const output = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, progressive: true })
    .toBuffer();

  await upload(path, output);

  return {
    path,
    status: "optimized",
    beforeKB: Math.round((input.length / 1024) * 10) / 10,
    afterKB: Math.round((output.length / 1024) * 10) / 10,
  };
}

(async () => {
  console.log("Walking:", PREFIX || "(root)");
  const files = await walk(PREFIX);
  console.log("Found:", files.length);

  const results = await Promise.allSettled(
    files.map((f) => limit(() => processOne(f))),
  );

  let ok = 0,
    skipped = 0,
    failed = 0;

  for (const r of results) {
    if (r.status === "fulfilled") {
      const v = r.value;
      if (v.status === "optimized") {
        ok++;
        console.log(`✅ ${v.path}  ${v.beforeKB}KB → ${v.afterKB}KB`);
      } else {
        skipped++;
      }
    } else {
      failed++;
      console.error("❌", r.reason?.message || r.reason);
    }
  }

  console.log({ ok, skipped, failed });
})();
