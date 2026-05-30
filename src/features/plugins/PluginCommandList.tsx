import { createResource, For, Show } from "solid-js";
import { t } from "../../i18n";
import { ErrorBanner, type ErrorView, toErrorView } from "../feedback";
import { describeContribution, PluginApi, type PluginCommand } from "./api";

export interface PluginCommandListProps {
  /** When false the resource is not fetched (launcher closed). */
  active: boolean;
  /** Override the API client (tests / alternate base URL). */
  api?: PluginApi;
}

function toListError(error: unknown): ErrorView {
  return toErrorView(error, "Failed to load plugin commands");
}

/**
 * Read-only list of plugin command contributions, surfaced inside the command
 * launcher (`ux-command-launcher`; the launcher is v0's only display surface for
 * these).
 *
 * v0 has NO plugin execute endpoint, so every entry here is DISPLAY / RESERVED:
 * it is rendered but NOT runnable. Activating an entry only reveals a reserved
 * note — there is no execute call, ever. `dangerous` contributions carry a
 * danger indicator and `when` / required-capability hints are shown so a future
 * host has the context to wire capability checks + destructive confirmation.
 */
export function PluginCommandList(props: PluginCommandListProps) {
  const api = props.api ?? new PluginApi();
  const [commands] = createResource(
    () => props.active,
    (active) =>
      active ? api.commands() : Promise.resolve({ commands: [], warnings: [] }),
  );

  return (
    <section class="plugin-commands" aria-label="Plugin commands">
      <p class="plugin-commands__title">{t("plugins.title")}</p>
      <p class="plugin-commands__note muted">
        {t("plugins.reserved")}
      </p>

      <Show when={commands.error}>
        <div class="plugin-commands__error" aria-live="polite">
          <ErrorBanner error={toListError(commands.error)} />
        </div>
      </Show>

      <Show when={commands.loading}>
        <p class="plugin-commands__loading muted">{t("plugins.loading")}</p>
      </Show>

      <Show
        when={!commands.loading && (commands()?.commands.length ?? 0) > 0}
        fallback={
          <Show when={!commands.loading && !commands.error}>
            <p class="plugin-commands__empty muted">{t("plugins.empty")}</p>
          </Show>
        }
      >
        <ul class="plugin-commands__list">
          <For each={commands()?.commands ?? []}>
            {(command) => <PluginCommandItem command={command} />}
          </For>
        </ul>
      </Show>
    </section>
  );
}

function PluginCommandItem(props: { command: PluginCommand }) {
  const hint = () => describeContribution(props.command);
  return (
    <li class="plugin-commands__item">
      {/*
        Disabled by design: v0 has no execute endpoint, so the entry can never
        run. `title` documents why a click does nothing.
      */}
      <button
        type="button"
        class="plugin-commands__entry"
        classList={{
          "plugin-commands__entry--dangerous": props.command.dangerous,
        }}
        disabled
        title={t("plugins.reservedTooltip")}
      >
        <span class="plugin-commands__badge">{t("plugins.badge")}</span>
        <span class="plugin-commands__entry-title">{props.command.title}</span>
        <span class="plugin-commands__category">{props.command.category}</span>
        <Show when={props.command.dangerous}>
          <span class="plugin-commands__danger">{t("plugins.dangerous")}</span>
        </Show>
        <Show when={hint()}>
          <span class="plugin-commands__hint muted">{hint()}</span>
        </Show>
      </button>
    </li>
  );
}
