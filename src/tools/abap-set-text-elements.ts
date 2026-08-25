/**
 * abap_set_text_elements tool — Write text elements for an ABAP object.
 */

import { Type } from "typebox";
import { ADTClient, type TextElement } from "abap-adt-api";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

export const AbapSetTextElementsTool = {
  name: "abap_set_text_elements",
  label: "Write ABAP Text Elements",
  description:
    "Write (save) text elements for an ABAP object. Provide the object (name or objectUrl), the category, and an array of { id, text, maxLength?, ddicReference? }. The object is locked, written and unlocked automatically. Activate afterwards with abap_activate if needed.",
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
    category: Type.String({
      description: "Text element category: symbols, selections or headings.",
    }),
    elements: Type.Array(
      Type.Object({
        id: Type.String({ description: "Text element key, e.g. '001' or 'LISTHEADER'." }),
        text: Type.String({ description: "Text content." }),
        maxLength: Type.Optional(
          Type.Number({ description: "Maximum length (symbols only)." }),
        ),
        ddicReference: Type.Optional(
          Type.String({ description: "DDIC reference (selections only)." }),
        ),
      }),
    ),
    transport: Type.Optional(
      Type.String({
        description: "Transport / correction request number.",
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
      category: string;
      elements: Array<{
        id: string;
        text: string;
        maxLength?: number;
        ddicReference?: string;
      }>;
      transport?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const category = params.category as "symbols" | "selections" | "headings";
    const elements: TextElement[] = params.elements.map((e) => ({
      id: e.id,
      text: e.text,
      ...(e.maxLength !== undefined && { maxLength: e.maxLength }),
      ...(e.ddicReference !== undefined && { ddicReference: e.ddicReference }),
    }));

    const resolved = await withClient(
      config,
      async (client) => {
        const resolved = await resolveObject(client, params);
        const url = ADTClient.textElementsUrl(resolved.type, resolved.name);
        const lock = await client.lock(resolved.objectUrl, "MODIFY");
        try {
          await client.setTextElements(
            url,
            category,
            elements,
            lock.LOCK_HANDLE,
            params.transport,
          );
        } finally {
          await client.unLock(resolved.objectUrl, lock.LOCK_HANDLE);
        }
        return resolved;
      },
      { stateful: true },
    );

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Wrote ${elements.length} ${category} text element(s) to ${resolved.name}. ` +
            "Activate the object afterwards if required.",
        },
      ],
      details: {
        name: resolved.name,
        category,
        count: elements.length,
      },
    };
  },
};
