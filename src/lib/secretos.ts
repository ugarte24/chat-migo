/** Claves solo de servidor. Usa corchetes para no inlinear secretos en el bundle del navegador. */
export function secreto(
  nombre: "GEMINI_API_KEY" | "OPENAI_API_KEY" | "ELEVENLABS_API_KEY" | "ELEVENLABS_VOICE_ID",
): string {
  if (typeof process === "undefined" || process.env == null) return "";
  return process.env[nombre]?.trim() ?? "";
}
