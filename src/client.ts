/**
 * ADT client factory and operation runner.
 *
 * Wraps the `abap-adt-api` ADTClient so tools only deal with plain data and
 * clear, normalized errors. Connection lifecycle is managed per call:
 * a fresh client is created, logged in, used, and its session dropped.
 */

import {
  ADTClient,
  createSSLConfig,
  session_types,
  type AbapObjectStructure,
  type SearchResult,
  type ObjectTypeDescriptor,
} from "abap-adt-api";
import type { AbapProfile } from "./types.ts";
import { AbapObjectNotFoundError } from "./types.ts";

// Client creation

export function createClient(
  profile: AbapProfile,
  stateful = false,
): ADTClient {
  const options = profile.allowUnauthorized ? createSSLConfig(true) : {};
  const client = new ADTClient(
    profile.url,
    profile.username,
    profile.password,
    profile.client ?? "",
    profile.language ?? "",
    options,
  );
  client.stateful = stateful
    ? session_types.stateful
    : session_types.stateless;
  return client;
}

// Error normalization

function rootMessage(err: unknown): string {
  const e = err as { message?: string; localizedMessage?: string };
  if (typeof e?.message === "string" && e.message.length > 0) return e.message;
  return String(err);
}

/** Normalize any thrown value into a readable Error for the LLM. */
export function toError(err: unknown): Error {
  if (err instanceof Error) {
    // abap-adt-api errors already carry a useful message; keep it but strip
    // redundant prefixes so the LLM sees the SAP message directly.
    return new Error(rootMessage(err));
  }
  return new Error(String(err));
}

// Operation runner

export interface RunOptions {
  stateful?: boolean;
}

/**
 * Run an operation against a freshly-created, logged-in ADT client.
 * The session is dropped afterwards, and errors are normalized.
 */
export async function withClient<T>(
  profile: AbapProfile,
  fn: (client: ADTClient) => Promise<T>,
  options: RunOptions = {},
): Promise<T> {
  const client = createClient(profile, options.stateful);
  try {
    await client.login();
    return await fn(client);
  } catch (err) {
    throw toError(err);
  } finally {
    try {
      await client.dropSession();
    } catch {
      /* ignore */
    }
  }
}

// Object resolution

export interface ResolvedObject {
  /** Object name, e.g. ZCL_MY_CLASS */
  name: string;
  /** ADT type, e.g. CLAS/OC */
  type: string;
  /** Object URL, e.g. /sap/bc/adt/oo/classes/zcl_my_class */
  objectUrl: string;
  /** Parsed object structure */
  structure: AbapObjectStructure;
  /** Main source include URL (target for getObjectSource / setObjectSource) */
  mainInclude: string;
}

/**
 * Resolve an ABAP object to its structure and main source include.
 *
 * Either `objectUrl` (a full ADT object URL) or `name` (with an optional
 * `type` hint for the search) must be provided.
 */
export async function resolveObject(
  client: ADTClient,
  params: {
    name?: string;
    objectUrl?: string;
    type?: string;
  },
): Promise<ResolvedObject> {
  let objectUrl: string;
  let name: string;
  let type: string;

  if (params.objectUrl) {
    objectUrl = params.objectUrl;
    const structure = await client.objectStructure(objectUrl);
    name = structure.metaData["adtcore:name"] ?? "";
    type = structure.metaData["adtcore:type"] ?? "";
    return {
      name,
      type,
      objectUrl,
      structure,
      mainInclude: ADTClient.mainInclude(structure),
    };
  }

  if (!params.name) {
    throw new Error("Provide either 'name' or 'objectUrl' to address an object.");
  }

  const results = await client.searchObject(params.name, params.type, 20);
  const match = pickSearchResult(results, params.name);
  if (!match) {
    throw new AbapObjectNotFoundError(params.name);
  }

  objectUrl = match["adtcore:uri"];
  const structure = await client.objectStructure(objectUrl);
  name = structure.metaData["adtcore:name"] ?? match["adtcore:name"];
  type = structure.metaData["adtcore:type"] ?? match["adtcore:type"];

  return {
    name,
    type,
    objectUrl,
    structure,
    mainInclude: ADTClient.mainInclude(structure),
  };
}

/**
 * Pick the best search result for a query: an exact (case-insensitive) name
 * match wins, otherwise the first result is used.
 */
export function pickSearchResult(
  results: ReadonlyArray<SearchResult>,
  query: string,
): SearchResult | undefined {
  if (results.length === 0) return undefined;
  const q = query.toLowerCase();
  return results.find((r) => r["adtcore:name"].toLowerCase() === q) ?? results[0];
}

export async function listObjectTypes(
  client: ADTClient,
): Promise<ObjectTypeDescriptor[]> {
  return client.objectTypes();
}
