/**
 * abap_activate tool — Activate an ABAP object.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatActivation } from "../formatting/formatters.ts";

export const AbapActivateTool = {
  name: "abap_activate",
  label: "Activate ABAP Object",
  description:
    "Activate an ABAP object after writing changes. Provide the object (name or objectUrl). Returns activation messages and any inactive objects that resulted.",
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
    preauditRequested: Type.Optional(
      Type.Boolean({ description: "Request a pre-activation audit (default true)." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      name?: string;
      objectUrl?: string;
      type?: string;
      preauditRequested?: boolean;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const { resolved, activation } = await withClient(config, async (client) => {
      const resolved = await resolveObject(client, params);
      const activation = await client.activate(
        resolved.name,
        resolved.objectUrl,
        resolved.mainInclude,
        params.preauditRequested ?? true,
      );
      return { resolved, activation };
    });

    return {
      content: [
        { type: "text" as const, text: formatActivation(activation) },
      ],
      details: {
        name: resolved.name,
        success: activation.success,
        messages: activation.messages,
        inactive: activation.inactive,
      },
    };
  },
};
