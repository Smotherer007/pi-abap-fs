/**
 * abap_where_used tool — Find where an ABAP object is used.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatUsageReferences } from "../formatting/formatters.ts";

export const AbapWhereUsedTool = {
  name: "abap_where_used",
  label: "Find ABAP Object Usage",
  description:
    "Find where an ABAP object is referenced (where-used list). Provide the object name or URL. Returns the list of referencing objects.",
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
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; name?: string; objectUrl?: string; type?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { resolved, references } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const references = await client.usageReferences(resolved.mainInclude);
      return { resolved, references };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: formatUsageReferences(references),
        },
      ],
      details: {
        name: resolved.name,
        count: references.length,
        references: references.map((r) => ({
          name: r["adtcore:name"] || r.objectIdentifier,
          type: r["adtcore:type"],
          description: r["adtcore:description"],
        })),
      },
    };
  },
};
