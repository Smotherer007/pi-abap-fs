/**
 * abap_node_contents tool — Browse the object tree of a package (or program / function group).
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";
import { formatNodes } from "../formatting/formatters.ts";

export const AbapNodeContentsTool = {
  name: "abap_node_contents",
  label: "Browse ABAP Object Tree",
  description:
    "Browse the contents of an SAP package (or program / function group) to discover the objects inside it. parentType is usually 'DEVC/K' for packages; pass the package name as parentName. Use '$TMP' for local objects.",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    parentType: Type.String({
      description: "Parent object type: DEVC/K (package), PROG/P (program), FUGR/F (function group), PROG/PI (include).",
    }),
    parentName: Type.Optional(
      Type.String({
        description: "Parent object name, e.g. 'Z_MY_PACKAGE' or '$TMP'. Omit to list the top level.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: { profile?: string; parentType: string; parentName?: string },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const structure = await withClient(config, (client) =>
      client.nodeContents(
        params.parentType as "DEVC/K" | "PROG/P" | "FUGR/F" | "PROG/PI",
        params.parentName,
      ),
    );

    return {
      content: [{ type: "text" as const, text: formatNodes(structure) }],
      details: {
        nodeCount: structure.nodes.length,
        nodes: structure.nodes.map((n) => ({
          name: n.OBJECT_NAME,
          type: n.OBJECT_TYPE,
          description: n.DESCRIPTION,
          uri: n.OBJECT_URI,
        })),
      },
    };
  },
};
