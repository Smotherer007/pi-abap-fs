/**
 * abap_status tool — Show current ABAP connection configuration status.
 */

import { Type } from "typebox";
import { getProfiles, getActiveProfile } from "../config.ts";
import { formatProfileStatus } from "../formatting/formatters.ts";

export const AbapStatusTool = {
  name: "abap_status",
  label: "ABAP Status",
  description:
    "Show current ABAP connection configuration status (which SAP systems are configured and which is active).",
  parameters: Type.Object({}),

  async execute(_toolCallId: string, _params: {}, _signal: AbortSignal) {
    const allProfiles = getProfiles();
    const active = getActiveProfile();

    return {
      content: [
        { type: "text" as const, text: formatProfileStatus(allProfiles, active) },
      ],
      details: {
        configured: Object.keys(allProfiles).length > 0,
        profileCount: Object.keys(allProfiles).length,
        activeProfile: active,
        profiles: Object.keys(allProfiles),
      },
    };
  },
};
