/**
 * abap_syntax_check tool — Run a syntax check on ABAP source.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatSyntaxCheck } from "../formatting/formatters.ts";

export const AbapSyntaxCheckTool = {
  name: "abap_syntax_check",
  label: "ABAP Syntax Check",
  description:
    "Run a syntax check on source code. Provide the object (name or objectUrl) and the source to check (for unsaved content), or omit source to check the object's currently saved main include.",
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
    source: Type.Optional(
      Type.String({
        description:
          "Source to check. When omitted, the currently saved main include is checked.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      name?: string;
      objectUrl?: string;
      type?: string;
      source?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { resolved, results } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const source =
        params.source ?? (await client.getObjectSource(resolved.mainInclude));
      const results = await client.syntaxCheck(
        resolved.mainInclude,
        resolved.mainInclude,
        source,
      );
      return { resolved, results };
    });

    return {
      content: [
        { type: "text" as const, text: formatSyntaxCheck(results) },
      ],
      details: {
        name: resolved.name,
        messageCount: results.length,
        messages: results,
      },
    };
  },
};
