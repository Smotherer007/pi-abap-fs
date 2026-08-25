/**
 * abap_text_elements tool — Read text elements (symbols / selection texts / headings).
 */

import { Type } from "typebox";
import { ADTClient } from "abap-adt-api";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatTextElements } from "../formatting/formatters.ts";

export const AbapTextElementsTool = {
  name: "abap_text_elements",
  label: "Read ABAP Text Elements",
  description:
    "Read the text elements of an ABAP object: symbols (text symbols), selections (selection texts) or headings. Provide the object (name or objectUrl).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    name: Type.Optional(
      Type.String({ description: "Object name, e.g. 'ZCL_MY_CLASS' or a program." }),
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
    category: Type.Optional(
      Type.String({
        description: "Text element category: symbols, selections or headings. Default 'symbols'.",
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
      category?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const category = (params.category ?? "symbols") as
      | "symbols"
      | "selections"
      | "headings";

    const { resolved, result } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const url = ADTClient.textElementsUrl(resolved.type, resolved.name);
      const result = await client.getTextElements(url, category);
      return { resolved, result };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: formatTextElements(result, category),
        },
      ],
      details: {
        name: resolved.name,
        category,
        count: result.textElements.length,
        textElements: result.textElements,
      },
    };
  },
};
