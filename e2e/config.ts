import z from "zod";

export const testConfigSchema = z.object({
  APP_ID: z.string(),
  RUNTIME: z.enum(["docker", "npm"]),
});
