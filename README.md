# anemi meets

A modern, calming web application for coordinating coffee meetups with friends. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🌿 Clean, minimalist UI design
- 🌐 Bilingual support (English & Dutch)
- 📅 Easy date and time selection
- 🏙️ City-based cafe suggestions
- 📱 Fully responsive design
- 🔗 Simple invite sharing system
- 🔔 Realtime invitation updates

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
5. Copy `.env.example` to `.env` and set your environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MEETING_REMINDERS_SECRET`, etc.)
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
  - The command spins up the Vite dev server automatically. Set `BASE_URL` if you
    want to point the tests at a different running instance.
  - Browsers are downloaded on first run; reuse of the dev server is disabled in
    CI when the `CI` environment variable is present.
  - Ensure a valid `.env` file is present so Vite can read the Supabase keys.

## Realtime Experience

Dashboard pages subscribe to invitation changes using Supabase Realtime. New invitations or status updates appear immediately without reloading, so you always see the latest meetups as soon as they happen.

## Deploying Supabase Functions

Deploy the reminder function with:

```bash
supabase functions deploy send-meeting-reminders --project-ref <your-project-id> --no-verify-jwt
```

Configure the schedule for this function in `supabase/config.toml`. See the [Supabase docs](https://supabase.com/docs/guides/functions/schedule-functions) for details.
## Invitation Security

Row level security is enabled on the `invitations` table. A signed-in user can read or modify a row when their user ID matches `invitee_id` or their email matches `email_a` or `email_b`. Inserts require `email_a` to equal the authenticated user's email.


## Database Migrations

Migrations are stored under `supabase/migrations`. The latest migration
(`20250615_add_invitation_indexes_and_foreign_keys.sql`) adds indexes for
`invitations.token`, `invitations.selected_date` and sets up foreign key
constraints linking invitations to cafes and various user tables.

## Database Schema Updates (July 2025)

- The canonical schema for the `cafes` table is now defined in `supabase/migrations/20250701_create_cafes_table.sql`. This includes all fields used in production: tags, transport, price_bracket, opening_hours (jsonb), open_morning, open_afternoon, open_evening, rating, verified, etc.
- The `profiles` table now includes a `cafe_preferences` (jsonb) column, as defined in `supabase/migrations/20250701_add_cafe_preferences_to_profiles.sql`.
- These migrations should be used as the reference for future development and for recreating the schema from scratch.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
