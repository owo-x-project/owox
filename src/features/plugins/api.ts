import { apiRequest } from "../../api/http";

/**
 * A plugin as returned by `GET /api/plugins`. Matches `SPEC-shared-http-api`
 * (Plugin): the read endpoint exposes only id / name / version / capabilities;
 * no host absolute path is ever returned.
 */
export interface PluginSummary {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
}

/** Response of `GET /api/plugins`. */
export interface PluginListResponse {
  plugins: PluginSummary[];
  /** Non-fatal load warnings (reserved fields, disabled commands, …). */
  warnings: string[];
}

/**
 * A command contributed by a plugin. Field set matches `SPEC-shared-http-api`
 * (Plugin command contribution) exactly.
 *
 * In v0 these are DISPLAY / RESERVED only: there is NO execute endpoint, so a
 * contribution is never runnable. `capabilities` lists the host capabilities
 * the command requires; `when` is a reserved context hint; `dangerous` flags a
 * command that a future host would route through destructive confirmation.
 */
export interface PluginCommand {
  id: string;
  plugin_id: string;
  title: string;
  category: string;
  capabilities: string[];
  when: string | null;
  args_schema: unknown;
  dangerous: boolean;
}

/** Response of `GET /api/plugins/commands`. */
export interface PluginCommandListResponse {
  commands: PluginCommand[];
  /** Non-fatal load warnings. */
  warnings: string[];
}

/**
 * Typed client for the plugin READ endpoints, built on {@link apiRequest}.
 *
 * v0 has NO execute endpoint by design — a plugin never touches the
 * filesystem, process table, network, or repo without a declared capability,
 * and that boundary is enforced by simply not implementing execution. This
 * client therefore exposes reads only.
 */
export class PluginApi {
  constructor(private readonly baseUrl = "") {}

  /** List installed plugins (id / name / version / capabilities). */
  list(): Promise<PluginListResponse> {
    return apiRequest<PluginListResponse>(
      "/api/plugins",
      undefined,
      this.baseUrl,
    );
  }

  /** List enabled command contributions across all plugins. */
  commands(): Promise<PluginCommandListResponse> {
    return apiRequest<PluginCommandListResponse>(
      "/api/plugins/commands",
      undefined,
      this.baseUrl,
    );
  }
}

/**
 * A short, human capability / context hint for a contribution, e.g.
 * `"workspace · needs: process"`. Pure helper (unit-tested) so the launcher can
 * render a consistent reserved badge without inline string juggling.
 */
export function describeContribution(command: PluginCommand): string {
  const parts: string[] = [];
  if (command.when !== null && command.when !== "") {
    parts.push(command.when);
  }
  if (command.capabilities.length > 0) {
    parts.push(`needs: ${command.capabilities.join(", ")}`);
  }
  return parts.join(" · ");
}
