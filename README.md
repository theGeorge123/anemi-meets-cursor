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
- 🏆 Achievement badges system
- 👥 Friend requests and management
- 😊 Customizable profile emojis
- 🎨 Calming animated background
- 🔍 Error tracking with Sentry

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- React Router
- i18next for internationalization
- React DatePicker
- Vite

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Install the Supabase CLI:**
   ```bash
   npm install -g supabase
   ```
4. **Start the local Supabase stack** (applies migrations and seeds `supabase/seed.sql`):
   ```bash
   supabase start
   ```
5. **Copy `.env.example` to `.env` and set your environment variables:**
   See the table below for required variables.
6. **Start the development server:**
   ```bash
   npm run dev
   ```
7. **Open** [http://localhost:5173](http://localhost:5173) **in your browser**

## Environment Variables

| Variable                  | Required | Description                                       |
| ------------------------- | -------- | ------------------------------------------------- |
| VITE_SUPABASE_URL         | Yes      | Your Supabase project URL                         |
| VITE_SUPABASE_ANON_KEY    | Yes      | Supabase anon public key (frontend)               |
| SUPABASE_URL              | Yes      | Root URL of your Supabase project (for functions) |
| SUPABASE_SERVICE_ROLE_KEY | Yes      | Supabase service role key (server-side/functions) |
| RESEND_API_KEY            | Yes      | API key for Resend (email delivery)               |
| MEETING_REMINDERS_SECRET  | Yes      | Secret for meeting reminders function             |
| PUBLIC_SITE_URL           | No       | Public site URL for links in emails               |

## Environment Setup

To run this project locally, you need to set up your environment variables:

1. Create a `.env` file in the project root
2. Add the following variables with your Supabase project values:
   ```
   VITE_SUPABASE_URL=your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Get these values from your Supabase project settings:
   - Go to Project Settings > API
   - Copy the "Project URL" for VITE_SUPABASE_URL
   - Copy the "anon" key for VITE_SUPABASE_ANON_KEY

Note: The `.env` file is intentionally gitignored for security. Never commit your API keys to version control!

## Typical Workflows

- **Development:**
  - `npm run dev` — Start the frontend and work locally.
  - `supabase start` — Run the local Supabase backend.
  - Edit code, migrations, or functions and see changes live.
- **Testing:**
  - `npm run test:e2e` — Run Playwright end-to-end tests. (Requires Supabase and Vite dev server running, or will start Vite automatically.)
  - `npm run lint` — Run ESLint for code quality.
- **Building:**
  - `npm run build` — Build the app for production (output in `dist/`).
  - `npm run preview` — Preview the production build locally.
- **Deploying:**
  - Deploy the frontend to Vercel, Netlify, or your preferred static host.
  - Deploy Supabase Edge Functions with:
    ```bash
    supabase functions deploy <function-name> --project-ref <your-project-id> --no-verify-jwt
    ```
  - Schedule or trigger functions as needed (see below).
  - For production, ensure all environment variables are set in your host and Supabase project.

## Project Structure

```
src/
  components/     # Shared, reusable UI components (not feature-specific)
  utils/          # Shared utility functions (not feature-specific)
  features/       # Major features/domains, each in its own folder
    <feature>/    # Each feature contains its own components, hooks, and services
      components/ # Feature-specific components
      README.md   # Describes the feature and its main components
  pages/          # Page-level components (route targets)
  data/           # Mock or static data
  i18n/           # Internationalization setup and translation files
  App.tsx         # Main app component
  main.tsx        # Entry point
```

- **Shared components** (e.g., buttons, modals, navigation) live in `src/components/`.
- **Shared utilities** (e.g., formatting, error handling) live in `src/utils/`.
- **Feature folders** in `src/features/` group all logic, UI, and services for a domain (see each feature's README for details).

This structure keeps the codebase scalable and maintainable as new features are added.

## Supabase Edge Functions

All Edge Functions are in `supabase/functions/`. Deploy with the Supabase CLI. Most require environment variables (see above).

### Function Reference

#### award-badges

- **Purpose:** Awards badges to users based on actions (e.g., first meetup, five meetups).
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Usage:**
  - `POST` JSON: `{ "userId": "uuid", "action": "check_meetup_badges", "metadata": {} }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"userId":"<user-uuid>","action":"check_meetup_badges"}' \
    https://<project-ref>.functions.supabase.co/award-badges
  ```
- **Errors:** Returns 200 with `{ success: true }` or error details in JSON.

#### beta-accept-email

- **Purpose:** Sends a welcome email when a user is accepted to the beta.
- **Env:** `RESEND_API_KEY`
- **Usage:**
  - Triggered by a beta signup acceptance event.
  - `POST` JSON: `{ "record": { "email": "user@example.com", "status": "accepted" } }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"record":{"email":"user@example.com","status":"accepted"}}' \
    https://<project-ref>.functions.supabase.co/beta-accept-email
  ```
- **Errors:** Returns 200 on success, 500 on error.

#### send-meeting-reminders

- **Purpose:** Sends email reminders for upcoming meetups (24h/1h before).
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MEETING_REMINDERS_SECRET`
- **Usage:**
  - `POST` with `Authorization: Bearer <MEETING_REMINDERS_SECRET>`
  - No body required.
  - Also scheduled via cron (see `Deno.cron` in code).
- **Example:**
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $MEETING_REMINDERS_SECRET" \
    https://<project-ref>.functions.supabase.co/send-meeting-reminders
  ```
- **Errors:** 401 if secret is missing/invalid, 500 if env vars are missing.

#### send-friend-invite

- **Purpose:** Sends a friend invite email and creates a friend_invite record.
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `PUBLIC_SITE_URL`
- **Usage:**
  - `POST` with `Authorization: Bearer <JWT>`
  - JSON: `{ "inviter_id": "uuid", "invitee_email": "friend@example.com", "lang": "en" }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"invitee_email":"friend@example.com","lang":"en"}' \
    https://<project-ref>.functions.supabase.co/send-friend-invite
  ```
- **Errors:** 401 if JWT is missing/invalid, 500 on server error.

#### send-meeting-confirmation

- **Purpose:** Confirms a meetup, updates invitation, and sends confirmation email with calendar invite.
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- **Usage:**
  - `POST` JSON: `{ "token": "invite-token", "email_b": "user@example.com", "selected_date": "YYYY-MM-DD", "selected_time": "morning", "lang": "en" }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"token":"invite-token","email_b":"user@example.com","selected_date":"2024-07-01","selected_time":"morning","lang":"en"}' \
    https://<project-ref>.functions.supabase.co/send-meeting-confirmation
  ```
- **Errors:** 400/404/500 with error message in JSON.

#### create-notification

- **Purpose:** Creates a notification for a user in the database.
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Usage:**
  - `POST` with `Authorization: Bearer <JWT>`
  - JSON: `{ "user_id": "uuid", "type": "info", "content": "...", "related_id": "..." }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"user_id":"<user-uuid>","type":"info","content":"Welcome!"}' \
    https://<project-ref>.functions.supabase.co/create-notification
  ```
- **Errors:** 401 if JWT is missing/invalid, 400/500 on error.

#### contact

- **Purpose:** Receives contact/support form submissions.
- **Env:** None required
- **Usage:**
  - `POST` JSON: `{ "name": "Your Name", "email": "your@email.com", "message": "Hello!" }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"name":"Your Name","email":"your@email.com","message":"Hello!"}' \
    https://<project-ref>.functions.supabase.co/contact
  ```
- **Errors:** 400 if fields are missing, 200 on success.

#### report-issue

- **Purpose:** Receives bug reports or feedback from users.
- **Env:** None required
- **Usage:**
  - `POST` JSON: `{ "description": "Bug details", "steps": "...", "screenshot": null, "context": {} }`
- **Example:**
  ```bash
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"description":"Bug details","steps":"Step 1, Step 2"}' \
    https://<project-ref>.functions.supabase.co/report-issue
  ```
- **Errors:** 400 if description is missing, 200 on success.

#### delete-account

- **Purpose:** Deletes a user from Auth and their profile from the database.
- **Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Usage:**
  - `POST` with `Authorization: Bearer <JWT>`
  - No body required (user is inferred from JWT)
- **Example:**
  ```bash
  curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    https://<project-ref>.functions.supabase.co/delete-account
  ```
- **Errors:** 401 if JWT is missing/invalid, 500 on error.

## Error Handling & Logging

The application uses a comprehensive error handling and logging system across both frontend and backend:

### Frontend Error Handling

- **Error Boundary**: A React Error Boundary component (`src/components/ErrorBoundary.tsx`) catches and handles rendering errors:

  - Displays user-friendly error messages
  - Provides reload and error reporting options
  - Integrates with Sentry for error tracking
  - Shows detailed error information in development

- **Centralized Logging**: A singleton Logger class (`src/utils/logger.ts`) provides:
  - Consistent log formatting
  - Environment-aware logging (development vs. production)
  - Log levels (debug, info, warn, error)
  - Sentry integration for error tracking
  - Context and breadcrumb support
  - User and session tracking

### Backend Error Handling

- **Supabase Edge Functions**: Centralized error handling utilities (`supabase/functions/utils.ts`):
  - Standardized error responses
  - Error classification with codes
  - Consistent HTTP status codes
  - Detailed error context
  - Environment variable validation

### Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "status": 400,
  "details": {} // Optional additional context
}
```

### Error Codes

Common error codes include:

- `INVALID_REQUEST`: Invalid request format or parameters
- `UNAUTHORIZED`: Authentication required or failed
- `NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Input validation failed
- `DATABASE_ERROR`: Database operation failed
- `EMAIL_ERROR`: Email sending failed
- `SERVER_ERROR`: Internal server error

### Logging Best Practices

1. **Frontend**:

   ```typescript
   import { logger } from '@/utils/logger';

   // Info logging with context
   logger.info('User action completed', { action: 'signup', userId: '123' });

   // Error logging
   try {
     // ... code that might throw
   } catch (error) {
     logger.error('Failed to process action', error, { context: 'additional info' });
   }
   ```

2. **Backend**:

   ```typescript
   import { AppError, ERROR_CODES } from '../utils';

   try {
     // Validate input
     if (!isValid) {
       throw new AppError('Invalid input', ERROR_CODES.VALIDATION_ERROR, 400);
     }

     // Handle known errors
   } catch (error) {
     // Error will be automatically formatted and logged
     throw error;
   }
   ```

### Monitoring & Debugging

- All errors are tracked in Sentry with:

  - Stack traces
  - User context
  - Browser/OS information
  - Recent breadcrumbs
  - Related events

- Development mode includes:
  - Detailed error messages
  - Component stack traces
  - Console logging
  - Error reporting UI

## Achievement Badges

The application includes a gamification system with achievement badges that users can earn through various actions:

- First meetup completion
- Reaching meetup milestones (5, 10, etc.)
- Growing friend network
- Profile completion
- And more!

Badges are automatically awarded through the `award-badges` Edge Function, which is triggered after relevant actions.

## Friend Management

The friend system includes several features:

- Send and receive friend requests
- Accept or reject incoming requests
- View pending friend requests
- Remove existing friends
- See friend activity and status
- Automatic friendship creation for invited users

Friend relationships are managed through the `friendships` and `friend_requests` tables, with proper RLS policies for security.

## Deployment Tips

- **Frontend:** Deploy the `dist/` folder to Vercel, Netlify, or any static host. Set all required environment variables in your host's dashboard.
- **Supabase Functions:** Deploy each function with the Supabase CLI. Set all required environment variables in your Supabase project dashboard (Project Settings > Environment Variables).
- **Database:** Apply new migrations with `supabase db push` or via the Supabase dashboard.
- **Secrets:** Never commit `.env` files or secrets to version control.

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

## Running Tests

Before running tests, make sure you have installed all dependencies, including dev dependencies:

```
npm install
```

or, for CI environments:

```
npm ci
```

This ensures tools like `vitest` are available. Then you can run:

```
npm run test:components
```
