const config = {
  PORT: Number(Bun.env.PORT ?? 5000),
}

const METERED_PATH_PREFIXES = [
  '/ai',
  '/llm'
];

export {
  config,
  METERED_PATH_PREFIXES,
}

