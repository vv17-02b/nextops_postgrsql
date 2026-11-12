#!/usr/bin/env node
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function deriveKey(rawSecret) {
  return createHash('sha256').update(rawSecret, 'utf8').digest();
}

function encryptBuffer(plainBuffer, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: [12-byte IV][16-byte AuthTag][Ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

function decryptBuffer(encryptedBuffer, key) {
  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const ciphertext = encryptedBuffer.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function hmacSha256(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

async function uploadToS3Compatible(objectKey, bodyBuffer) {
  const endpoint = process.env.BACKUP_S3_ENDPOINT;
  const bucket = process.env.BACKUP_S3_BUCKET;
  const region = process.env.BACKUP_S3_REGION || 'auto';
  const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const baseUrl = endpoint.replace(/\/$/, '');
  const targetUrl = new URL(`${baseUrl}/${bucket}/${objectKey}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(bodyBuffer);

  const canonicalUri = targetUrl.pathname;
  const canonicalHeaders =
    `host:${targetUrl.host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, 's3');
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(targetUrl.toString(), {
    method: 'PUT',
    headers: {
      Host: targetUrl.host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
      'Content-Type': 'application/octet-stream',
    },
    body: bodyBuffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloud backup upload failed (${response.status}): ${errText}`);
  }

  return `${bucket}/${objectKey}`;
}

async function runBackup() {
  const encryptionSecret = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!encryptionSecret || encryptionSecret.length < 16) {
    throw new Error('Set BACKUP_ENCRYPTION_KEY (at least 16 chars) before running encrypted backups.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const containerTmp = `/tmp/nextops-${timestamp}.dump`;
  const backupsDir = resolve(process.cwd(), 'backups');
  mkdirSync(backupsDir, { recursive: true });

  const rawDumpPath = join(backupsDir, `nextops-${timestamp}.dump`);
  const encryptedFileName = `nextops-${timestamp}.dump.enc`;
  const encryptedPath = join(backupsDir, encryptedFileName);

  execFileSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      '-e',
      `BACKUP_FILE=${containerTmp}`,
      'postgres',
      'sh',
      '-c',
      'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$BACKUP_FILE"',
    ],
    { stdio: 'inherit' },
  );

  execFileSync('docker', ['compose', 'cp', `postgres:${containerTmp}`, rawDumpPath], {
    stdio: 'inherit',
  });
  execFileSync('docker', ['compose', 'exec', '-T', 'postgres', 'rm', '--', containerTmp], {
    stdio: 'inherit',
  });

  const plainDump = readFileSync(rawDumpPath);
  const encryptedDump = encryptBuffer(plainDump, deriveKey(encryptionSecret));
  writeFileSync(encryptedPath, encryptedDump);
  unlinkSync(rawDumpPath);

  console.log(`Encrypted AES-256-GCM backup created: ${encryptedPath}`);

  const remoteLocation = await uploadToS3Compatible(encryptedFileName, encryptedDump);
  if (remoteLocation) {
    console.log(`Uploaded encrypted backup to off-site S3/R2 storage: ${remoteLocation}`);
  } else {
    console.log('Cloud S3/R2 credentials not set; encrypted backup retained locally.');
  }
}

async function runRestore(encryptedFilePath) {
  if (!encryptedFilePath) {
    throw new Error('Provide --file <path-to-backup.dump.enc> for restore.');
  }
  const encryptionSecret = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!encryptionSecret) {
    throw new Error('Set BACKUP_ENCRYPTION_KEY to decrypt the backup file.');
  }

  const encryptedData = readFileSync(resolve(encryptedFilePath));
  const decryptedDump = decryptBuffer(encryptedData, deriveKey(encryptionSecret));

  const containerTmp = `/tmp/restore-${Date.now()}.dump`;
  const localTmp = resolve(process.cwd(), `tmp-restore-${Date.now()}.dump`);
  writeFileSync(localTmp, decryptedDump);

  try {
    execFileSync('docker', ['compose', 'cp', localTmp, `postgres:${containerTmp}`], {
      stdio: 'inherit',
    });
    execFileSync(
      'docker',
      [
        'compose',
        'exec',
        '-T',
        '-e',
        `BACKUP_FILE=${containerTmp}`,
        'postgres',
        'sh',
        '-c',
        'pg_restore --clean --if-exists --no-owner --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$BACKUP_FILE"',
      ],
      { stdio: 'inherit' },
    );
  } finally {
    unlinkSync(localTmp);
    execFileSync('docker', ['compose', 'exec', '-T', 'postgres', 'rm', '-f', containerTmp], {
      stdio: 'ignore',
    });
  }

  console.log('Decrypted backup successfully restored to PostgreSQL.');
}

const args = process.argv.slice(2);
if (args.includes('--restore')) {
  const fileIndex = args.indexOf('--file');
  runRestore(fileIndex >= 0 ? args[fileIndex + 1] : undefined).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  runBackup().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
