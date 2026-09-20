import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/server/database/migrations",
  schema: "./src/server/database/schema.ts",
  dialect: "sqlite",
});
