/**
 * abap_object_types tool — List searchable object types and their descriptors.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatObjectTypes } from "../formatting/formatters.ts";

export const AbapObjectTypesTool = {
  name: "abap_object_types",
  label: "List ABAP Object Types",
  description:
    "List the object types available for searching on the connected system. Useful to discover the correct type hint for abap_search (e.g. CLAS, PROG, FUGR, INTF).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const types = await withClient(config, (client) => client.objectTypes());

    return {
      content: [
        { type: "text" as const, text: formatObjectTypes(types) },
      ],
      details: { count: types.length, types },
    };
  },
};
