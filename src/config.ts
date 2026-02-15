const config = {
  PORT: Number(Bun.env.PORT ?? 5000),
  UPSTREAM_BASE_URL: "http://localhost:4000",
  UPSTREAM_TIMEOUT_MS: 5000
}

const METERED_PATH_PREFIXES = [
  '/ai',
  '/llm'
];

export {
  config,
  METERED_PATH_PREFIXES,
}

