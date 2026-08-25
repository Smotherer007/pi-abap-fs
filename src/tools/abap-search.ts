/**
 * abap_search tool — Search ABAP objects by name pattern.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatSearchResults } from "../formatting/formatters.ts";

export const AbapSearchTool = {
  name: "abap_search",
  label: "Search ABAP Objects",
  description:
    "Search ABAP objects by name pattern (supports wildcards on most systems). Returns object name, type, package and object URL for each match. Use the returned object URL with abap_read, abap_object_structure, etc.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    query: Type.String({
      description: "Search pattern, e.g. 'ZCL_MY_CLASS' or 'Z*PRICING*'",
    }),
    objectType: Type.Optional(
      Type.String({
        description:
          "Optional object type filter. The first part is used, e.g. 'CLAS', 'PROG', 'FUGR', 'INTF', 'TABL'. Use abap_object_types to see available types.",
      }),
    ),
    max: Type.Optional(
      Type.Number({ description: "Maximum number of results (default 100)." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; query: string; objectType?: string; max?: number },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const max = params.max ?? 100;

    const results = await withClient(config, (client) =>
      client.searchObject(params.query, params.objectType, max),
    );

    return {
      content: [
        {
          type: "text" as const,
          text: formatSearchResults(results, params.query),
        },
      ],
      details: {
        count: results.length,
        query: params.query,
        results: results.map((r) => ({
          name: r["adtcore:name"],
          type: r["adtcore:type"],
          package: r["adtcore:packageName"],
          description: r["adtcore:description"],
          objectUrl: r["adtcore:uri"],
        })),
      },
    };
  },
};
