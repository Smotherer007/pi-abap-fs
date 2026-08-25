/**
 * abap_profile tool — List, switch or delete configured SAP profiles.
 */

import { Type } from "typebox";
import {
  deleteProfile,
  getActiveProfile,
  getProfiles,
  setActiveProfile,
} from "../config.ts";
import { formatProfileStatus } from "../formatting/formatters.ts";

export const AbapProfileTool = {
  name: "abap_profile",
  label: "Manage ABAP Profiles",
  description:
    "List configured SAP connection profiles, switch the active one, or delete a profile. Without arguments it lists all profiles.",
  parameters: Type.Object({
    action: Type.Optional(
      Type.String({
        description: "One of: list, use, delete. Defaults to list.",
      }),
    ),
    name: Type.Optional(
      Type.String({ description: "Profile name for 'use' and 'delete'." }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { action?: string; name?: string },
    _signal: AbortSignal,
  ): Promise<{
    content: { type: "text"; text: string }[];
    details: Record<string, unknown>;
  }> {
    const action = (params.action || "list").toLowerCase();

    if (action === "list") {
      return {
        content: [
          {
            type: "text" as const,
            text: formatProfileStatus(getProfiles(), getActiveProfile()),
          },
        ],
        details: {
          profiles: Object.keys(getProfiles()),
          activeProfile: getActiveProfile(),
        },
      };
    }

    if (!params.name) {
      throw new Error(`The "${action}" action requires a profile name.`);
    }

    if (action === "use") {
      setActiveProfile(params.name);
      return {
        content: [
          {
            type: "text" as const,
            text: `Active SAP profile is now "${params.name}".`,
          },
        ],
        details: { activeProfile: params.name },
      };
    }

    if (action === "delete") {
      const removed = deleteProfile(params.name);
      const text = removed
        ? `Profile "${params.name}" deleted. Active profile is now ${getActiveProfile() ? `"${getActiveProfile()}"` : "unset"}.`
        : `No profile named "${params.name}".`;
      return {
        content: [{ type: "text" as const, text }],
        details: { deleted: removed, activeProfile: getActiveProfile() },
      };
    }

    throw new Error(
      `Unknown action "${params.action}". Use one of: list, use, delete.`,
    );
  },
};
