/**
 * Client-Side Zero-Knowledge End-to-End Encryption Engine
 * Implements Web Crypto API AES-GCM with PBKDF2 Key Derivation.
 * Guarantees that unencrypted reflections never leave the browser when enabled.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const ENCRYPTION_PREFIX = 'enc:v1:';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM CryptoKey from a user passphrase and cryptographic salt.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext string using AES-GCM 256-bit.
 * Returns formatted string: enc:v1:<salt>:<iv>:<ciphertext>
 */
export async function encryptText(plaintext: string, passphrase: string): Promise<string> {
  if (!passphrase || !plaintext) return plaintext;

  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plaintext)
  );

  const saltB64 = arrayBufferToBase64(salt.buffer);
  const ivB64 = arrayBufferToBase64(iv.buffer);
  const cipherB64 = arrayBufferToBase64(ciphertextBuffer);

  return `${ENCRYPTION_PREFIX}${saltB64}:${ivB64}:${cipherB64}`;
}

/**
 * Decrypts a formatted cipher string using the user's passphrase.
 */
export async function decryptText(cipherString: string, passphrase: string): Promise<string> {
  if (!cipherString.startsWith(ENCRYPTION_PREFIX)) {
    return cipherString; // Plaintext
  }

  if (!passphrase) {
    throw new Error('Vault passphrase is required to decrypt this entry.');
  }

  const parts = cipherString.slice(ENCRYPTION_PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed cipher string');
  }

  const [saltB64, ivB64, cipherB64] = parts;
  const salt = new Uint8Array(base64ToArrayBuffer(saltB64));
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const ciphertext = base64ToArrayBuffer(cipherB64);

  const key = await deriveKey(passphrase, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

export function isEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith(ENCRYPTION_PREFIX);
}
