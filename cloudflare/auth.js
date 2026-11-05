/**
 * Mereb Cryptographic Auth & Security Utilities
 * Implemented using native Web Crypto API (SubtleCrypto) on Cloudflare Edge.
 * Zero external dependencies.
 */

const DEFAULT_SECRET = 'mereb_jwt_secret_dev_32b_production_salt';

/**
 * Returns SHA-256 hex string of input string
 */
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encodes string or object to Base64URL
 */
function base64UrlEncode(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const bin = btoa(unescape(encodeURIComponent(str)));
  return bin.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes Base64URL to JSON or string
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const decoded = decodeURIComponent(escape(atob(base64)));
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

/**
 * Generates an HMAC-SHA256 signed JWT session token
 */
export async function createSessionToken(user, secret = DEFAULT_SECRET, ttlSeconds = 30 * 86400) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    githubId: user.github_id || user.githubId,
    username: user.username,
    plan: user.plan || 'free',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || DEFAULT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  const sigArray = Array.from(new Uint8Array(signature));
  const bin = String.fromCharCode(...sigArray);
  const encodedSignature = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifies HMAC-SHA256 JWT session token. Returns payload if valid, null otherwise.
 */
export async function verifySessionToken(token, secret = DEFAULT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret || DEFAULT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64Sig = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const sigBin = atob(base64Sig);
    const sigBytes = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) {
      sigBytes[i] = sigBin.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(dataToSign));
    if (!isValid) return null;

    const payload = base64UrlDecode(encodedPayload);
    if (!payload || !payload.exp) return null;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}

/**
 * Generates RFC 5766 TURN REST API HMAC-SHA1 credential
 */
export async function generateTurnHmac(secret, username) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'mereb_default_turn_secret_dev_32b'),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(username));
  let bin = '';
  const bytes = new Uint8Array(sig);
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

/**
 * Validates Polar Webhook signature
 */
export async function verifyPolarWebhook(request, rawBody, webhookSecret) {
  if (!webhookSecret) return true; // dev mode bypass when secret not set
  const signatureHeader = request.headers.get('webhook-signature') || request.headers.get('polar-signature');
  const webhookId = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');

  if (!signatureHeader) return false;

  try {
    const cleanSecret = webhookSecret.startsWith('whsec_')
      ? atob(webhookSecret.slice(6))
      : webhookSecret;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      typeof cleanSecret === 'string' ? enc.encode(cleanSecret) : cleanSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const payloadToSign = webhookId && timestamp ? `${webhookId}.${timestamp}.${rawBody}` : rawBody;
    const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payloadToSign));
    let bin = '';
    const bytes = new Uint8Array(sigBytes);
    for (let i = 0; i < bytes.byteLength; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    const computedSignature = btoa(bin);
    const signatures = signatureHeader.split(' ').map(s => s.replace(/^v1,/, ''));
    return signatures.includes(computedSignature);
  } catch (err) {
    console.error('Polar signature verification failed:', err);
    return false;
  }
}
