// Updated to produce URL-safe Base64 without padding
const uint8ArrayToBase64 = (u8Arr) => {
  const CHUNK_SIZE = 0x8000;
  let result = "";
  for (let i = 0, len = u8Arr.length; i < len; i += CHUNK_SIZE) {
    const chunk = u8Arr.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode.apply(null, chunk);
  }
  const base64 = btoa(result)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64;
};

// Updated to handle URL-safe Base64 with padding
const base64ToUint8Array = (base64) => {
  let padded = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  padded += "=".repeat(padLength);
  const binaryString = atob(padded);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0, len = binaryString.length; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export { uint8ArrayToBase64, base64ToUint8Array };
