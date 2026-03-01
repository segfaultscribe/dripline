// configLoader.ts
import { parse } from "yaml";
import type { DriplineConfig } from "./types";

let cachedConfig: DriplineConfig | null = null;

// Helper to safely convert user-defined wildcards to Regex
// e.g., "/v1/models*" becomes /^\/v1\/models.*$/
function compileRoutePattern(pattern: string): RegExp {
    const escaped = pattern.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    const regexString = "^" + escaped.replace(/\*/g, ".*") + "$";
    return new RegExp(regexString);
}

export async function loadConfig(): Promise<DriplineConfig> {
    if (cachedConfig) return cachedConfig;

    const fileContents = await Bun.file("./dripline.yaml").text();
    const rawConfig = parse(fileContents);

    // Map over the parsed YAML and attach the compiled Regex
    cachedConfig = {
        upstream_url: rawConfig.upstream_url,
        metered_routes: rawConfig.metered_routes.map((route: any) => ({
            ...route,
            matcher: compileRoutePattern(route.path_pattern)
        }))
    };

    return cachedConfig;
}

export function getConfig(): DriplineConfig {
    if (!cachedConfig) throw new Error("Config accessed before loaded!");
    return cachedConfig;
}