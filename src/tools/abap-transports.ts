/**
 * abap_transports tool — List the transport requests of the current user.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatTransports } from "../formatting/formatters.ts";

export const AbapTransportsTool = {
  name: "abap_transports",
  label: "List ABAP Transports",
  description:
    "List the transport requests of a user. By default lists the transports of the profile's username. Use the returned transport numbers with abap_write (transport parameter).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    user: Type.Optional(
      Type.String({
        description:
          "User to list transports for. Defaults to the connected user.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; user?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const transports = await withClient(config, (client) =>
      client.userTransports(params.user ?? config.username),
    );

    return {
      content: [
        { type: "text" as const, text: formatTransports(transports) },
      ],
      details: { transports },
    };
  },
};
