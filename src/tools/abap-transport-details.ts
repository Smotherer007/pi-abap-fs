/**
 * abap_transport_details tool — Show details of a single transport request.
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatTransportDetails } from "../formatting/formatters.ts";

export const AbapTransportDetailsTool = {
  name: "abap_transport_details",
  label: "ABAP Transport Details",
  description:
    "Show details of a single transport request: description, status, owner, its tasks and the objects it contains. Provide the transport number (e.g. 'DEVK900123') from abap_transports.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    transportNumber: Type.String({
      description: "Transport request number, e.g. 'DEVK900123'.",
    }),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; transportNumber: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const request = await withClient(config, (client) =>
      client.transportDetails(params.transportNumber.toUpperCase()),
    );

    return {
      content: [
        { type: "text" as const, text: formatTransportDetails(request) },
      ],
      details: {
        transport: request["tm:number"],
        status: request["tm:status"],
        owner: request["tm:owner"],
        taskCount: request.tasks.length,
        objectCount:
          (request.objects?.length ?? 0) +
          request.tasks.reduce((n, t) => n + (t.objects?.length ?? 0), 0),
      },
    };
  },
};
