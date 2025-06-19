# Supabase Backend

This folder contains all backend resources and configuration for the Supabase project.

## Purpose
- Store database migrations, SQL schema changes, and seed data
- Store Edge Functions (serverless functions)
- Store Supabase configuration files

## Structure
- `migrations/`: SQL files for schema changes and seeds
- `functions/`: Edge Functions (Deno/TypeScript serverless functions)
- `config.toml`: Supabase project configuration

## Example Usage
- Add new migrations to `migrations/` when updating the database schema
- Add new serverless functions to `functions/` for backend logic
- Update `config.toml` for project-wide settings

Keep all Supabase-related backend code and configuration in this folder. 