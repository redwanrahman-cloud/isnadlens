import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  // Runtime source data stays included; private development records and secrets do not.
  outputFileTracingExcludes: {'/*': ['./artifacts/private/**/*', './.env*']},
};
export default config;
