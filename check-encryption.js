const crypto = require("crypto");
require("dotenv").config();

const encrypted =
  "f7316bc9a5316bee6b80665eb9fa4e87:ddc8031c86cc9cb3971b02eeac954f0c";

const keys = {
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  ENCRYPTION_KEY_PREVIOUS: process.env.ENCRYPTION_KEY_PREVIOUS,
};

for (const [name, secret] of Object.entries(keys)) {
  if (!secret || secret.length < 32) {
    console.log(name + ": INVALID_OR_MISSING");
    continue;
  }

  try {
    const [ivHex, ciphertextHex] = encrypted.split(":");

    const key = crypto.scryptSync(secret, "salt", 32);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key,
      Buffer.from(ivHex, "hex")
    );

    const decrypted =
      decipher.update(ciphertextHex, "hex", "utf8") +
      decipher.final("utf8");

    console.log(name + ": CAN_DECRYPT -> " + decrypted);
  } catch {
    console.log(name + ": CANNOT_DECRYPT");
  }
}