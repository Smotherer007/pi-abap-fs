/**
 * abap_object_structure tool — Read an object's metadata and includes.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatObjectStructure } from "../formatting/formatters.ts";

export const AbapObjectStructureTool = {
  name: "abap_object_structure",
  label: "ABAP Object Structure",
  description:
    "Get metadata (type, description, responsible, language) and include list for an ABAP object, plus the main source URL. Provide either a name (with optional type hint) or an object URL.",
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
    const resolved = await withClient(config, (client) =>
      resolveObject(client, params),
    );

    return {
      content: [
        {
          type: "text" as const,
          text: formatObjectStructure(resolved.structure),
        },
      ],
      details: {
        name: resolved.name,
        type: resolved.type,
        objectUrl: resolved.objectUrl,
        mainInclude: resolved.mainInclude,
      },
    };
  },
};
