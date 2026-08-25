/**
 * abap_create_object tool — Create a new ABAP object (class, program, …).
 */

import { Type } from "typebox";
import { withClient } from "../client.ts";
import { resolveConfig } from "../config.ts";

const CREATABLE_TYPES = new Set([
  "CLAS/OC",
  "INTF/OI",
  "PROG/P",
  "PROG/I",
  "FUGR/F",
  "FUGR/FF",
  "FUGR/I",
  "TABL/DT",
  "TABL/DS",
  "DTEL/DE",
  "DOMA/DD",
  "DDLS/DF",
  "DCLS/DL",
  "DDLX/EX",
  "DDLA/ADF",
  "SRVD/SRV",
  "MSAG/N",
  "AUTH",
  "SUSO/B",
  "DEVC/K",
]);

/** Resolve the container URI used for function-group includes/modules. */
function parentPathFor(objectType: string, parentName: string): string {
  const encoded = encodeURIComponent(parentName.toLowerCase());
  if (
    objectType === "FUGR/F" ||
    objectType === "FUGR/FF" ||
    objectType === "FUGR/I"
  ) {
    return `/sap/bc/adt/functions/groups/${encoded}`;
  }
  return parentName ? `/sap/bc/adt/packages/${encoded}` : "";
}

export const AbapCreateObjectTool = {
  name: "abap_create_object",
  label: "Create ABAP Object",
  description:
    "Create a new ABAP object programmatically. Provide the object type (e.g. CLAS/OC, INTF/OI, PROG/P, PROG/I, FUGR/F, TABL/DT, DTEL/DE, DOMA/DD, DDLS/DF), the name, the parent package, and a description. The object is created in the given transport (or locally when omitted).",
  parameters: Type.Object({
    profile: Type.Optional(
      Type.String({
        description: "Profile name to use. Uses active profile if omitted.",
      }),
    ),
    objectType: Type.String({
      description:
        "Object type, e.g. 'CLAS/OC' (class), 'INTF/OI' (interface), 'PROG/P' (program), 'PROG/I' (include), 'FUGR/F' (function group), 'FUGR/FF' (function module), 'TABL/DT' (table), 'DTEL/DE' (data element), 'DOMA/DD' (domain), 'DDLS/DF' (CDS view).",
    }),
    name: Type.String({
      description: "Object name, e.g. 'ZCL_MY_CLASS'.",
    }),
    parentName: Type.String({
      description:
        "Parent package name (e.g. 'Z_MY_PACKAGE') — or the function group name for FUGR/FF and FUGR/I. Use '$TMP' for local objects.",
    }),
    description: Type.String({
      description: "Object description.",
    }),
    transport: Type.Optional(
      Type.String({
        description: "Transport / correction request number.",
      }),
    ),
  }),

  async execute(
    _toolCallId: string,
    params: {
      profile?: string;
      objectType: string;
      name: string;
      parentName: string;
      description: string;
      transport?: string;
    },
    _signal: AbortSignal,
  ) {
    const config = resolveConfig(params.profile);
    const objectType = params.objectType.toUpperCase();

    if (!CREATABLE_TYPES.has(objectType)) {
      throw new Error(
        `Unsupported object type "${params.objectType}". Supported: ${[...CREATABLE_TYPES].join(", ")}`,
      );
    }

    await withClient(config, (client) =>
      client.createObject({
        objtype: objectType as never,
        name: params.name,
        parentName: params.parentName,
        description: params.description,
        parentPath: parentPathFor(objectType, params.parentName),
        transport: params.transport,
        language: config.language ?? "EN",
      }),
    );

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Created ${objectType} "${params.name}" in ${params.parentName}.` +
            (params.transport ? ` Transport: ${params.transport}.` : "") +
            " Use abap_read to verify and abap_write to add source code.",
        },
      ],
      details: {
        objectType,
        name: params.name,
        parentName: params.parentName,
        transport: params.transport ?? null,
      },
    };
  },
};
