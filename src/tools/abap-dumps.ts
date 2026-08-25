/**
 * abap_dumps tool — List runtime dumps (ABAP short dumps) on the system.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatDumps } from "../formatting/formatters.ts";

export const AbapDumpsTool = {
  name: "abap_dumps",
  label: "List ABAP Runtime Dumps",
  description:
    "List ABAP runtime dumps (short dumps) on the connected system. Optionally filter with a query string (e.g. a program name).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    query: Type.Optional(
      Type.String({
        description: "Optional filter, e.g. a program name or '*'. Defaults to all dumps.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; query?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const feed = await withClient(config, (client) =>
      client.dumps(params.query ?? ""),
    );

    return {
      content: [{ type: "text" as const, text: formatDumps(feed) }],
      details: {
        count: feed.dumps.length,
        dumps: feed.dumps.map((d) => ({
          id: d.id,
          type: d.type,
          text: d.text,
          author: d.author,
        })),
      },
    };
  },
};
