// Ye function har browser aur har connection (HTTP ya HTTPS) pe kaam karta hai,
// crypto.randomUUID() ki tarah nahi jo sirf secure (HTTPS/localhost) connection par milta hai.
export function randomId(length = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Pura UUID jaisa unique string chahiye ho (jaise file naam ke liye)
export function randomUuidLike(): string {
  return `${randomId(8)}-${randomId(4)}-${randomId(4)}-${randomId(4)}-${randomId(12)}`;
}