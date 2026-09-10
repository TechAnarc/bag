# Triveni Jewellers Backend API

This is a production-ready Node.js backend for the Triveni Jewellers platform, built with Express, TypeScript, and Prisma.

## 🚀 Prerequisites

-   **Node.js**: v18 or higher
-   **PostgreSQL**: v14 or higher (Running on port 5432 by default)
-   **Terminal**: PowerShell, Bash, or Command Prompt

## 🛠️ Setup & Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    -   Copy `.env.example` to `.env` (if not already done).
    -   Ensure your PostgreSQL database is running.
    -   Check `.env`:
        ```env
        PORT=4000
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/triveni_db?schema=public"
        ```
    -   *Note: If your database uses a different user/password/port, update `DATABASE_URL` accordingly.*

4.  **Database Setup:**
    ```bash
    # Generate Prisma Client
    npm run prisma:generate

    # Run Migrations (Creates tables)
    npm run prisma:migrate

    # Seed Database (Adds initial products/users)
    npm run prisma:seed
    ```

5.  **Start the Server:**
    ```bash
    # Development Mode
    npm run dev

    # Production Mode
    npm run build
    npm start
    ```

## 🧪 Testing

We have provided a verification script to test the API end-to-end.

1.  Ensure the server is running (`npm run dev`).
2.  In a separate terminal, run:
    ```bash
    npx tsx scripts/verify-api.ts
    ```

## 📚 API Structure

-   **Auth**: `/api/v1/auth` (Register, Login, Refresh)
-   **Products**: `/api/v1/products` (List, Search, Detail)
-   **Cart**: `/api/v1/cart` (Add, Remove, Update)
-   **Orders**: `/api/v1/orders` (Create, History, Verify Payment)
-   **Contact**: `/api/v1/contact` (Submit form)

## 🔒 Security

-   **Helmet**: Secure HTTP Headers
-   **CORS**: Restricted to frontend origin
-   **Rate Limiting**: Protected against brute force
-   **Validation**: Zod schema validation for all inputs

## ⚠️ Troubleshooting

-   **"Connection Refused"**: Ensure PostgreSQL is running. Check port (5432 vs 5433).
-   **"Bun not found"**: We have updated scripts to use `tsx` and `node` for better compatibility. You can use `npm` commands safely.
-   **"Prisma Client not initialized"**: Run `npm run prisma:generate`.
