import crypto from "crypto";

function getGuestTokenSecret() {
  const secret = process.env.GUEST_ORDER_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing guest order token secret. Set GUEST_ORDER_TOKEN_SECRET or NEXTAUTH_SECRET.");
  }
  return secret;
}

export function generateGuestOrderToken(orderId: string) {
  return crypto
    .createHmac("sha256", getGuestTokenSecret())
    .update(orderId)
    .digest("hex");
}

export function verifyGuestOrderToken(orderId: string, token: string) {
  if (!orderId || !token) {
    return false;
  }

  const expected = generateGuestOrderToken(orderId);

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
