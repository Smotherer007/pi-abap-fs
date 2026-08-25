/**
 * abap_read tool — Read the source code of an ABAP object.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

export const AbapReadTool = {
  name: "abap_read",
  label: "Read ABAP Source",
  description:
    "Read the main source code of an ABAP object (class, program, function group, interface, …). Provide either a name (with optional type hint) or an object URL. Returns the full source as text.",
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
    const { source, resolved } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const source = await client.getObjectSource(resolved.mainInclude);
      return { source, resolved };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: source,
        },
      ],
      details: {
        name: resolved.name,
        type: resolved.type,
        objectUrl: resolved.objectUrl,
        mainInclude: resolved.mainInclude,
        lines: source.split("\n").length,
      },
    };
  },
};
