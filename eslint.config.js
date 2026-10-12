const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // design/ is the read-only web prototype export; supabase/functions is Deno code (deno lint).
    ignores: ['dist/*', 'design/*', '.expo/*', 'supabase/functions/*'],
  },
]);
