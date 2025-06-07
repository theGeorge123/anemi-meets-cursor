# anemi meets

A modern, calming web application for coordinating coffee meetups with friends. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🌿 Clean, minimalist UI design
- 🌐 Bilingual support (English & Dutch)
- 📅 Easy date and time selection
- 🏙️ City-based cafe suggestions
- 📱 Fully responsive design
- 🔗 Simple invite sharing system

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- React Router
- i18next for internationalization
- React DatePicker
- Vite

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
4. Start the local Supabase stack (applies migrations and seeds `supabase/seed.sql`):
   ```bash
   supabase start
   ```
5. Copy `.env.example` to `.env` and set your environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.)
6. Start the development server:
   ```bash
   npm run dev
   ```
7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── data/          # Mock data
  ├── i18n/          # Internationalization
  ├── App.tsx        # Main app component
  └── main.tsx       # Entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run test:e2e` - Run Playwright end-to-end tests

## Deploying Supabase Functions

Deploy the reminder function with:

```bash
supabase functions deploy send-meeting-reminders --project-ref <your-project-id> --no-verify-jwt
```

Configure the schedule for this function in `supabase/config.toml`. See the [Supabase docs](https://supabase.com/docs/guides/functions/schedule-functions) for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
