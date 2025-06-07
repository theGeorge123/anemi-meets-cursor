# Feature-Based Folder Structure

This directory is for grouping major features and domains of the Anemi Meets app. As the project grows, organizing by feature/domain (rather than by type) keeps related logic, UI, and services together, making the codebase easier to navigate and maintain.

## Why Feature Folders?
- **Scalability:** Easily add new features (e.g., communities, messaging, events) without cluttering the root or pages/ directory.
- **Maintainability:** All logic, components, and services for a feature live together.
- **Clarity:** Reduces cognitive load—developers know where to look for related code.

## Example Structure
```
src/
  features/
    communities/
      CommunitiesPage.tsx
      CommunityService.ts
      useCommunities.ts
    messaging/
      MessagingPage.tsx
      MessageList.tsx
      useMessages.ts
    meetups/
      components/
        DateSelector.tsx
      ...
    friends/
      FriendList.tsx
      FriendService.ts
      useFriends.ts
    ...
```

## Best Practices
- **Add a new folder for each major domain/feature.**
- **Move related types, hooks, and services into the same folder.**
- **Keep shared, generic components in `src/components/`.**
- **Rename files/routes for clarity as you expand features.**

This approach is future-proof and can be adopted incrementally—no need to refactor everything at once. Start with new features, and migrate existing code as you touch it. 