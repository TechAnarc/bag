import { defineConfig } from "vitest/config";

// Ensure default test environment variables are loaded
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/triveni_test?schema=public";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-12345678901234567890";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-12345678901234567890";
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "test-admin-secret-12345678901234567890";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trivenibombaybaghouse.com";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TestAdminPassword123!";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});

