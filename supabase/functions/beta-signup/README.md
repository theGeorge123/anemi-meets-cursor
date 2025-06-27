# beta-signup

## Purpose

Handles initial beta signup requests by adding email addresses to the `beta_signups` table with `status: 'pending'`.

## Usage

- **Triggered by:** User submitting beta signup form
- **Method:** `POST`
- **Body:** `{ "email": "user@example.com" }`

## Response

- **Success (200):** `{ "message": "Successfully added to beta list", "data": {...} }`
- **Duplicate (409):** `{ "message": "Email already on beta list", "error": "DUPLICATE_EMAIL" }`
- **Error (400/500):** Error details

## Flow

1. User submits email via frontend form
2. Function validates email format
3. Function inserts record into `beta_signups` table with `status: 'pending'`
4. Admin can later change status to `'accepted'` via dashboard
5. When status changes to `'accepted'`, trigger fires and calls `beta-accept-email` function
6. Welcome email is sent to accepted users

## Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
