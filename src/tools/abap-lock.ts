/**
 * abap_lock tool — Lock an ABAP object for editing (returns a lock handle).
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatLock } from "../formatting/formatters.ts";

export const AbapLockTool = {
  name: "abap_lock",
  label: "Lock ABAP Object",
  description:
    "Lock an ABAP object for editing. Returns a lock handle that must be passed to abap_write or released with abap_unlock when done. Provide either a name (with optional type hint) or an object URL.",
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
    accessMode: Type.Optional(
      Type.String({ description: "Lock access mode, e.g. 'MODIFY' (default) or 'EDIT'." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      name?: string;
      objectUrl?: string;
      type?: string;
      accessMode?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const result = await withClient(
      config,
      async (client) => {
        const resolved = await resolveObject(client, params);
        const lock = await client.lock(
          resolved.objectUrl,
          params.accessMode ?? "MODIFY",
        );
        return { resolved, lock };
      },
      { stateful: true },
    );

    return {
      content: [
        {
          type: "text" as const,
          text: formatLock(result.lock),
        },
      ],
      details: {
        name: result.resolved.name,
        objectUrl: result.resolved.objectUrl,
        mainInclude: result.resolved.mainInclude,
        lockHandle: result.lock.LOCK_HANDLE,
        corrNr: result.lock.CORRNR,
      },
    };
  },
};
