/**
 * abap_write tool — Write source code to an ABAP object.
 *
 * Self-contained: resolves the object, locks it, writes the source, then
 * unlocks it. If a lockHandle is provided, the caller owns the lock and it
 * is NOT unlocked automatically.
 */

import { Type } from "typebox";
import { resolveObject, withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

export const AbapWriteTool = {
  name: "abap_write",
  label: "Write ABAP Source",
  description:
    "Write (save) source code to an ABAP object. Provide the object (name or objectUrl), the full new source, and optionally a transport request number. If a lockHandle from a previous abap_lock call is provided, that lock is used and left in place; otherwise the object is locked, written, and unlocked automatically. Use abap_activate afterwards to activate the change.",
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
    source: Type.String({
      description: "The full new source code to write.",
    }),
    transport: Type.Optional(
      Type.String({
        description:
          "Transport / correction request number, e.g. 'DEVK900123'. Only used when a new lock is taken.",
      }),
    ),
    lockHandle: Type.Optional(
      Type.String({
        description:
          "Optional lock handle from a previous abap_lock call. When provided, the lock is used and NOT released automatically.",
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
      source: string;
      transport?: string;
      lockHandle?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);

    const result = await withClient(
      config,
      async (client) => {
        const resolved = await resolveObject(client, params);

        let lockHandle = params.lockHandle;
        let selfLocked = false;
        if (!lockHandle) {
          const lock = await client.lock(resolved.objectUrl, "MODIFY");
          lockHandle = lock.LOCK_HANDLE;
          selfLocked = true;
        }

        try {
          await client.setObjectSource(
            resolved.mainInclude,
            params.source,
            lockHandle,
            params.transport,
          );
        } finally {
          if (selfLocked) {
            await client.unLock(resolved.objectUrl, lockHandle);
          }
        }

        return { resolved, selfLocked };
      },
      { stateful: true },
    );

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Source written to ${result.resolved.name}. ` +
            (result.selfLocked
              ? "Lock released automatically."
              : "Lock left in place (caller owns it).") +
            " Use abap_activate to activate the change.",
        },
      ],
      details: {
        name: result.resolved.name,
        type: result.resolved.type,
        objectUrl: result.resolved.objectUrl,
        lines: params.source.split("\n").length,
        lockReleased: result.selfLocked,
      },
    };
  },
};
