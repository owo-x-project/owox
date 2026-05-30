import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../src/api/http";
import {
  describeContribution,
  PluginApi,
  type PluginCommand,
} from "../../src/features/plugins/api";

function command(over: Partial<PluginCommand> = {}): PluginCommand {
  return {
    id: "example-plugin.example",
    plugin_id: "example-plugin",
    title: "Example Command",
    category: "plugin",
    capabilities: [],
    when: "workspace",
    args_schema: null,
    dangerous: false,
    ...over,
  };
}

describe("PluginApi", () => {
  it("reads the plugin list contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        plugins: [
          {
            id: "example-plugin",
            name: "Example Plugin",
            version: "1.0.0",
            capabilities: [],
          },
        ],
        warnings: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new PluginApi().list();

    expect(fetchMock).toHaveBeenCalledWith("/api/plugins", expect.anything());
    expect(result.plugins[0].id).toBe("example-plugin");
    expect(result.plugins[0].version).toBe("1.0.0");
  });

  it("reads the command-contribution contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        commands: [command({ dangerous: true, capabilities: ["process"] })],
        warnings: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new PluginApi().commands();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plugins/commands",
      expect.anything(),
    );
    expect(result.commands[0].id).toBe("example-plugin.example");
    expect(result.commands[0].dangerous).toBe(true);
    expect(result.commands[0].plugin_id).toBe("example-plugin");
  });

  it("throws the typed error envelope on a non-2xx read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            kind: "unknown",
            message: "Unexpected error",
            target: null,
            recoverability: "inspect_log",
            next_action: null,
            log_ref: null,
            request_id: "req_1",
          },
        }),
      }),
    );

    await expect(new PluginApi().commands()).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });
});

describe("describeContribution", () => {
  it("joins when and required capabilities", () => {
    expect(
      describeContribution(
        command({ when: "workspace", capabilities: ["process", "fs"] }),
      ),
    ).toBe("workspace · needs: process, fs");
  });

  it("renders only the when hint when no capabilities are required", () => {
    expect(
      describeContribution(command({ when: "workspace", capabilities: [] })),
    ).toBe("workspace");
  });

  it("renders only the capability hint when no when context is set", () => {
    expect(
      describeContribution(command({ when: null, capabilities: ["process"] })),
    ).toBe("needs: process");
  });

  it("returns an empty hint when neither is set", () => {
    expect(
      describeContribution(command({ when: null, capabilities: [] })),
    ).toBe("");
  });
});
