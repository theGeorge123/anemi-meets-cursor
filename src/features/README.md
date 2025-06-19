# Feature-Based Folder Structure

_See the main `README.md` for an overview of the entire project structure._

This directory is for grouping major features and domains of the Anemi Meets app. As the project grows, organizing by feature/domain (rather than by type) keeps related logic, UI, and services together, making the codebase easier to navigate and maintain.

## Folder Conventions
- Each feature folder should have its own `README.md` describing its purpose and main components/services.
- Each `components/` subfolder should have a `README.md` listing and describing its components.

## Why Feature Folders?
- **Scalability:** Easily add new features (e.g., communities, messaging, events) without cluttering the root or pages/ directory.
- **Maintainability:** All logic, components, and services for a feature live together.
- **Clarity:** Reduces cognitive load—developers know where to look for related code.

## Example Structure
```