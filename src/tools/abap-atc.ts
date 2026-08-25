/**
 * abap_atc tool — Run ABAP Test Cockpit (ATC) analysis on an object.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatAtcResult } from "../formatting/formatters.ts";

export const AbapAtcTool = {
  name: "abap_atc",
  label: "Run ATC Analysis",
  description:
    "Run ABAP Test Cockpit (ATC) analysis on an object and return its findings. Provide the object (name or objectUrl) and optionally a check variant name (default 'DEFAULT'). Use abap_object_types or a known variant name if the default is unavailable.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    name: Type.Optional(
      Type.String({ description: "Object name, e.g. 'ZCL_MY_CLASS'" }),
    ),
    objectUrl: Type.Optional(
      Type.String({
        description:
          "Object URL, e.g. '/sap/bc/adt/oo/classes/zcl_my_class'. Takes precedence over name.",
      }),
    ),
    type: Type.Optional(
      Type.String({ description: "Optional type hint for search, e.g. 'CLAS/OC'." }),
    ),
    variant: Type.Optional(
      Type.String({
        description: "ATC check variant / worklist id (default 'DEFAULT').",
      }),
    ),
    maxResults: Type.Optional(
      Type.Number({ description: "Maximum findings to collect (default 100)." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      name?: string;
      objectUrl?: string;
      type?: string;
      variant?: string;
      maxResults?: number;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { resolved, worklist } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const run = await client.createAtcRun(
        params.variant ?? "DEFAULT",
        resolved.mainInclude,
        params.maxResults ?? 100,
      );
      const worklist = await client.atcWorklists(run.id);
      return { resolved, worklist };
    });

    return {
      content: [
        { type: "text" as const, text: formatAtcResult(worklist) },
      ],
      details: {
        name: resolved.name,
        findingCount: worklist.objects.reduce(
          (n, o) => n + o.findings.length,
          0,
        ),
        findings: worklist.objects.flatMap((o) =>
          o.findings.map((f) => ({
            object: o.name,
            objectType: o.type,
            checkId: f.checkId,
            checkTitle: f.checkTitle,
            messageId: f.messageId,
            messageTitle: f.messageTitle,
            priority: f.priority,
          })),
        ),
      },
    };
  },
};
