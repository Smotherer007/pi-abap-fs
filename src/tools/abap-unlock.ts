/**
 * abap_unlock tool — Release a lock previously obtained with abap_lock.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

export const AbapUnlockTool = {
  name: "abap_unlock",
  label: "Unlock ABAP Object",
  description:
    "Release a lock on an ABAP object. Provide the object URL (or name) and the lock handle returned by abap_lock.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    objectUrl: Type.Optional(
      Type.String({
        description: "Object URL, e.g. '/sap/bc/adt/oo/classes/zcl_my_class'.",
      }),
    ),
    name: Type.Optional(
      Type.String({ description: "Object name (used only if objectUrl omitted)." }),
    ),
    type: Type.Optional(
      Type.String({ description: "Optional type hint for search, e.g. 'CLAS/OC'." }),
    ),
    lockHandle: Type.String({
      description: "The lock handle returned by abap_lock.",
    }),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      objectUrl?: string;
      name?: string;
      type?: string;
      lockHandle: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const resolved = await withClient(
      config,
      async (client) => {
        const resolved = await resolveObject(client, params);
        await client.unLock(resolved.objectUrl, params.lockHandle);
        return resolved;
      },
      { stateful: true },
    );

    return {
      content: [
        {
          type: "text" as const,
          text: `Unlocked ${resolved.name} (${resolved.objectUrl}).`,
        },
      ],
      details: {
        name: resolved.name,
        objectUrl: resolved.objectUrl,
      },
    };
  },
};
