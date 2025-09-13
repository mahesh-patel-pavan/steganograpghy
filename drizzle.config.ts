// drizzle.config.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env" }); // force loading .env file

import { defineConfig } from "drizzle-kit";

console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("￼ DATABASE_URL is not defined. Please check your .env file.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});