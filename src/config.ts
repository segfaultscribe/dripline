const config = {
  PORT: Number(Bun.env.PORT ?? 5000),
}

const METERED_PATH_PREFIXES = [
  '/ai',
  '/llm'
];

const UPSTREAM_BASE_URL="https://api.yourservice.com";
const UPSTREAM_TIMEOUT_MS=5000;


export {
  config,
  METERED_PATH_PREFIXES,
  UPSTREAM_BASE_URL,
  UPSTREAM_TIMEOUT_MS,
}

