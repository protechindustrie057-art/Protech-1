<<<<<<< HEAD
# Protech-1
Application de gestion pour ton activité d’impression numérique et maintenance  🏠 Tableau de bord
=======
# SK Parfumerie login


## Getting Started

First, install the dependencies:

```bash
pnpm install
# or
npm install
# or
yarn install
```

Then, run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

This project uses:
- **Next.js** - React framework for production
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Environment Variables

Create a `.env.local` file in the project root during local development, or add the same variables in Vercel dashboard.

Example values are in `.env.local.example`.

Required environment variables:

- `MONGODB_URI` — MongoDB connection string
  - Pour le développement local, si vous n’avez pas de `.env.local`, l’application essaiera `mongodb://127.0.0.1:27017`.
- `MONGODB_DB` — database name, e.g. `sk_parfumerie`
- `MONGODB_ALLOW_INVALID_CERTS` — `true` when your MongoDB certificate is self-signed/non-standard
- `NEXT_PUBLIC_API_BASE_URL` — API base path, usually `/api`

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

In Vercel, set the same environment variables under Project Settings → Environment Variables.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Windows Installer (Inno Setup)

To prepare a Windows installer for the application:

1. Install dependencies:

```bash
npm install
```

2. Build the app and generate the release package:

```bash
npm run prepare-release
```

3. Open `SK_Parfumerie.iss` in Inno Setup Compiler and compile the installer.

4. If the Inno Setup CLI is installed, you can also run:

```bash
npm run build-installer
```

The installer will copy the built app files to the selected installation folder, install production dependencies in that folder, and create a desktop shortcut.

---
>>>>>>> 3c887cf (Initial commit - SK Parfumerie application)
