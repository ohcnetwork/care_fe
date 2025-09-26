import { z } from "zod";

const envSchema = z.object({
  REACT_CARE_API_URL: z.string().url(),
});

export default async function validateEnv(
  env: Record<string, string | undefined>,
) {
  const result = await envSchema.safeParseAsync(env);
  if (!result.success) {
    throw new Error(result.error.message);
  }
}
