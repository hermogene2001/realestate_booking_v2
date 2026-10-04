# Kigali Real Estate Booking Platform

This repository contains a Next.js web client, an Express/TypeScript API, Prisma data models, and Hardhat smart contracts. The backend database is SQLite.

## Local database setup

1. Copy `backend/.env.example` to `backend/.env` and set the required application secrets and service URLs.
2. Keep `DATABASE_URL="file:./dev.db"` to store the local SQLite database at `backend/prisma/dev.db`.
3. From `backend`, run `npm run db:migrate` to create/update the database, then `npm run db:seed` if you want sample data.
4. Start the API and web app from the repository root with `npm run dev`.

SQLite is a local file, so no database server is required. Docker Compose stores its database in the persistent `sqlite_data` volume.

The existing MySQL migration history is retained under `backend/prisma/migrations_mysql_archive`. Existing MySQL database records are not automatically copied into SQLite; export and import them separately if they need to be preserved.