/**
 * zod's translated error messages are installed from their own chunk, so the
 * sign-in pages (which don't use zod) don't wait for it. The configuration
 * starts loading as soon as this module is imported.
 */
export const zodReady: Promise<void> = import("@/lib/zod")
  .then(({ initZod }) => initZod())
  .catch((error) => {
    console.error("Failed to configure zod:", error);
  });

/**
 * Wraps a lazy loader so the module resolves only once zod is configured. Use
 * it for views that build zod schemas, so their forms never validate with
 * zod's untranslated default messages. Load failures of the module itself
 * still reject as before.
 */
export function withZod<T>(load: () => Promise<T>): () => Promise<T> {
  return () => Promise.all([load(), zodReady]).then(([module]) => module);
}
