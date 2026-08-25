/**
 * abap_trace_hitlist tool — Analyze a performance trace (hit list + statements).
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatTraceHitList } from "../formatting/formatters.ts";

export const AbapTraceHitListTool = {
  name: "abap_trace_hitlist",
  label: "Analyze ABAP Trace",
  description:
    "Analyze an ABAP performance trace: returns the hot-spot hit list and the aggregated statement call tree. Provide the trace id returned by abap_traces.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    traceId: Type.String({
      description:
        "Trace id from abap_traces, e.g. '/sap/bc/adt/runtime/traces/abaptraces/...' or the short id.",
    }),
    withSystemEvents: Type.Optional(
      Type.Boolean({
        description: "Include system events (default false).",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; traceId: string; withSystemEvents?: boolean },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { hitList, statements } = await withClient(config, async (client) => {
      const hitList = await client.tracesHitList(
        params.traceId,
        params.withSystemEvents ?? false,
      );
      const statements = await client.tracesStatements(params.traceId, {
        withSystemEvents: params.withSystemEvents ?? false,
      });
      return { hitList, statements };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: formatTraceHitList(hitList, statements),
        },
      ],
      details: {
        hitCount: hitList.entries.length,
        statementCount: statements.count,
      },
    };
  },
};
