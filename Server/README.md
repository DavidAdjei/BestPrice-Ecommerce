# Best Price — Server (TypeScript + Prisma + MySQL)

## First-time setup

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL and the other values
npx prisma generate       # generates the typed Prisma Client — do this first
npx prisma migrate dev --name init   # creates the MySQL tables
npm run prisma:seed       # optional: adds sample categories/products
npm run dev                # starts the API on http://localhost:8000
```

> **Note:** the sandbox this was written in blocks the domain Prisma downloads
> its query-engine binary from, so `prisma generate` / `migrate` couldn't be
> run there — run them on your machine, where npm/Prisma have normal network
> access. `npx tsc --noEmit` was still run against everything by hand-checking
> the parts that don't depend on generated types; once you run `prisma
> generate` the remaining type errors (all in that category) will resolve.

## Scripts

- `npm run dev` — start the API with hot reload (tsx watch)
- `npm run build` / `npm start` — compile to `dist/` and run it
- `npm run typecheck` — `tsc --noEmit`
- `npm run prisma:migrate` — create/apply a migration
- `npm run prisma:studio` — open Prisma's DB browser GUI
- `npm run prisma:seed` — seed categories + sample products

## Structure

```
prisma/schema.prisma   the data model (see comments at the top for the
                       relational decisions vs. the old Mongo schema)
prisma/seed.ts
src/
  app.ts               express app + route wiring
  server.ts             http server + socket.io bootstrap
  routes/               one file per resource
  controllers/           request handlers
  middleware/           requireAuth, validate (zod), errorHandler
  sockets/               socket.io event handlers
  schemas/               zod request-validation schemas
  utils/                 jwt, password hashing, cloudinary, paystack, etc.
```

## What changed vs. the original Express/MongoDB server

- MySQL + Prisma instead of MongoDB + Mongoose (see the schema file's header
  comment for how the old embedded/array fields became real relations).
- Full TypeScript, Zod request validation, and a central error-handling
  middleware instead of scattered try/catch with inconsistent error shapes.
- **Fixed:** orders are now priced from the database at checkout time. The
  old server trusted the price sent by the client, so a request could be
  crafted to buy items at any price.
- **Added:** sellers can now see and update the orders placed against their
  products — there was previously no endpoint for this at all.
- **Added:** a persisted server-side cart (`CartItem`), so a logged-in
  buyer's cart follows them between devices instead of living only in
  browser storage.
- Image uploads go through `multer.memoryStorage()` straight to Cloudinary
  instead of writing to a local `uploads/` folder that was never cleaned up.
- The JWT cookie and the token's own expiry are now both 7 days (previously
  the cookie expired after 3 days while the token itself was valid for 7,
  so a session could look "logged out" client-side while the token was
  still technically valid).
