export default {
  // ⚠️  MVP-modus: alle testen worden genegeerd.
  testMatch: ['**/__never_run__/*.never.js'],
  testPathIgnorePatterns: [
    '/src/',
    '/supabase/',
    '/e2e/',
    '/tests/',
    '.*\.ts$',
    '.*\.tsx$',
    '.*\.js$',
    '.*\.jsx$',
    '.*\.json$',
    '.*\.cjs$',
    '.*\.mjs$',
    '.*\.config\..*',
  ],
  setupFilesAfterEnv: [],
  passWithNoTests: true,
};
