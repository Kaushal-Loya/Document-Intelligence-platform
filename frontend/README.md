# BookMind — Frontend

This is the Next.js frontend application for the **BookMind Platform**, an AI-Powered Book Intelligence interface layered with a completely custom `Cyber-Library` responsive UI.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS v4, Custom CSS (Glassmorphism, Neon glows, Radial setups)
- Icons: Lucide-React
- State: Native React Hooks

## Quick Start

1. Install all dependencies:
```bash
npm install
```

2. Duplicate the `.env.example` file (if provided) and fill out any optional client keys.
3. Start the Next.js local development server:
```bash
npm run dev
```

The server runs on `http://localhost:3000`.

## Architecture Note
This frontend executes all API commands directly against the Django background server (running natively on port 8000 via a Next API rewrite proxy) and supports real-time async DOM rendering during long-running background scraping jobs.
