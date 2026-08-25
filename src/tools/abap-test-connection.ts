/**
 * abap_test_connection tool — Verify that a profile can log on to the SAP system.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

export const AbapTestConnectionTool = {
  name: "abap_test_connection",
  label: "Test ABAP Connection",
  description:
    "Test the connection to an SAP system by logging in and reading the ADT compatibility graph. Use this to verify a profile works after abap_setup.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);

    const graph = await withClient(config, async (client) => {
      const compat = await client.adtCompatibiliyGraph();
      const discovery = await client.adtCoreDiscovery();
      return {
        compatibilityNodes: compat.nodes.map((n) => `${n.nameSpace}:${n.name}`),
        discoveryTitles: discovery.map((d) => d.title),
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Connected to ${config.url} as ${config.username}. Login successful.`,
        },
      ],
      details: {
        url: config.url,
        username: config.username,
        client: config.client ?? null,
        language: config.language ?? null,
        ...graph,
      },
    };
  },
};
