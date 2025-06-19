# Pages

This folder contains top-level page components that correspond to routes in the application. Each file typically represents a route (e.g., `/dashboard`, `/login`, `/meetups`).

## Purpose
- Page components are entry points for routes and often compose feature components, shared components, and handle route-specific logic.
- Pages should remain as thin as possible, delegating most logic and UI to feature or shared components.

## Example Pages
- `Dashboard.tsx`: User dashboard
- `Login.tsx`: Login form
- `Meetups.tsx`: Meetups overview
- `Account.tsx`: User account settings

Add new pages here as you add new routes to the app. 