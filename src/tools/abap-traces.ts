/**
 * abap_traces tool — List ABAP performance traces for a user.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatTraces } from "../formatting/formatters.ts";

export const AbapTracesTool = {
  name: "abap_traces",
  label: "List ABAP Traces",
  description:
    "List ABAP performance traces recorded for a user. By default lists the traces of the profile's username. Use abap_trace_hitlist with a trace id to analyze a trace.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    user: Type.Optional(
      Type.String({
        description: "User to list traces for. Defaults to the connected user.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; user?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const result = await withClient(config, (client) =>
      client.tracesList(params.user ?? config.username),
    );

    return {
      content: [{ type: "text" as const, text: formatTraces(result) }],
      details: {
        count: result.runs.length,
        runs: result.runs.map((r) => ({
          id: r.id,
          title: r.title,
          objectName: r.extendedData?.objectName,
          state: r.extendedData?.state?.text,
          runtime: r.extendedData?.runtime,
        })),
      },
    };
  },
};
