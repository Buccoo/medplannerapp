const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const hashMcpToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
};

export const createMcpToken = async () => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const token = `mp_${bytesToBase64Url(random)}`;
  return { token, hash: await hashMcpToken(token), prefix: token.slice(0, 11) };
};

