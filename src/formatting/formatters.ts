/**
 * Pure formatting functions that convert ADT data into display strings.
 * No I/O, no state — just data in, string out.
 */

import type {
  SearchResult,
  AbapObjectStructure,
  ActivationResult,
  UnitTestClass,
  QueryResult,
  NodeStructure,
  TransportsOfUser,
  TransportTarget,
  ObjectTypeDescriptor,
  UsageReference,
  AdtLock,
  SyntaxCheckResult,
  AtcWorkList,
  DumpsFeed,
  TraceResults,
  TraceHitList,
  TraceStatementResponse,
  TransportRequest,
  TextElementsResult,
} from "abap-adt-api";

function isClassStructure(
  s: AbapObjectStructure,
): s is AbapObjectStructure & { includes: unknown[] } {
  return Array.isArray((s as { includes?: unknown[] }).includes);
}

// Search

export function formatSearchResults(
  results: ReadonlyArray<SearchResult>,
  query: string,
): string {
  if (results.length === 0) {
    return `No objects found matching "${query}".`;
  }
  const lines = results.map((r) => {
    const parts = [
      r["adtcore:name"],
      `type=${r["adtcore:type"]}`,
    ];
    if (r["adtcore:packageName"]) parts.push(`package=${r["adtcore:packageName"]}`);
    if (r["adtcore:description"]) parts.push(r["adtcore:description"]);
    return `- ${parts.join(" | ")}  (${r["adtcore:uri"]})`;
  });
  return `${results.length} object(s) matching "${query}":\n${lines.join("\n")}`;
}

// Object structure

export function formatObjectStructure(s: AbapObjectStructure): string {
  const meta = s.metaData;
  const lines: string[] = [
    `Name: ${meta["adtcore:name"]}`,
    `Type: ${meta["adtcore:type"]}`,
  ];
  if (meta["adtcore:description"]) lines.push(`Description: ${meta["adtcore:description"]}`);
  lines.push(`Responsible: ${meta["adtcore:responsible"] ?? "?"}`);
  lines.push(`Language: ${meta["adtcore:language"] ?? "?"}`);
  if (isClassStructure(s)) {
    lines.push("Includes:");
    for (const inc of s.includes as Array<{ "class:includeType": string }>) {
      lines.push(`  - ${inc["class:includeType"]}`);
    }
  }
  return lines.join("\n");
}

// Activation

export function formatActivation(result: ActivationResult): string {
  if (result.success) {
    return "Activation successful.";
  }
  const lines = ["Activation failed."];
  if (result.messages.length > 0) {
    lines.push("Messages:");
    for (const m of result.messages) {
      lines.push(`  - [${m.type}] ${m.shortText} (line ${m.line})`);
    }
  }
  if (result.inactive.length > 0) {
    lines.push("Inactive objects:");
    for (const rec of result.inactive) {
      if (rec.object) {
        lines.push(`  - ${rec.object["adtcore:name"]} (${rec.object["adtcore:type"]}) by ${rec.object.user}`);
      }
    }
  }
  return lines.join("\n");
}

// Unit tests

export function formatUnitTests(classes: ReadonlyArray<UnitTestClass>): string {
  if (classes.length === 0) {
    return "No test classes found or no tests were executed.";
  }
  const lines: string[] = [];
  let totalMethods = 0;
  let failures = 0;
  for (const c of classes) {
    lines.push(`Class: ${c["adtcore:name"]} (risk=${c.riskLevel})`);
    for (const m of c.testmethods) {
      totalMethods++;
      const alert = m.alerts.find((a) => a.severity === "critical" || a.severity === "fatal");
      const status = alert ? `FAILED (${alert.severity})` : "passed";
      if (alert) failures++;
      lines.push(`  - ${m["adtcore:name"]}: ${status}`);
      if (alert) {
        lines.push(`      ${alert.title}`);
        for (const d of alert.details.slice(0, 5)) {
          lines.push(`      ${d.split("\n").join("\n      ")}`);
        }
      }
    }
  }
  lines.unshift(`${totalMethods} test method(s), ${failures} failure(s).`);
  return lines.join("\n");
}

// Query / table results

export function formatQueryResult(result: QueryResult): string {
  const { columns, values } = result;
  if (values.length === 0) {
    return "Query returned no rows.";
  }
  const names = columns.map((c) => c.name);
  const rows = values.map((row) =>
    names.map((n) => {
      const v = (row as Record<string, unknown>)[n];
      return v === null || v === undefined ? "" : String(v);
    }),
  );
  // Simple aligned table
  const widths = names.map((n, i) =>
    Math.max(n.length, ...rows.map((r) => r[i]?.length ?? 0)),
  );
  const fmt = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
  const lines = [
    fmt(names),
    widths.map((w) => "-".repeat(w)).join("-+-"),
    ...rows.map(fmt),
  ];
  lines.push(`\n${values.length} row(s).`);
  return lines.join("\n");
}

// Node contents (package / object tree)

export function formatNodes(structure: NodeStructure): string {
  if (structure.nodes.length === 0) {
    return "No child objects found.";
  }
  const lines = structure.nodes.map((n) => {
    const desc = n.DESCRIPTION ? ` (${n.DESCRIPTION})` : "";
    return `- ${n.OBJECT_NAME}  [${n.OBJECT_TYPE}]${desc}`;
  });
  return `${structure.nodes.length} node(s):\n${lines.join("\n")}`;
}

// Object types

export function formatObjectTypes(types: ReadonlyArray<ObjectTypeDescriptor>): string {
  if (types.length === 0) return "No object types available.";
  const lines = types.map(
    (t) => `- ${t.name} (${t.type}) — ${t.description ?? ""}`,
  );
  return `${types.length} object type(s):\n${lines.join("\n")}`;
}

// Transports

function targetRequests(t: TransportTarget): string[] {
  return [...t.modifiable, ...t.released].map((r) => {
    return `  - ${r["tm:number"]} [${r["tm:status"]}] ${r["tm:desc"]} (owner=${r["tm:owner"]})`;
  });
}

export function formatTransports(transports: TransportsOfUser): string {
  const allTargets = [
    ...transports.workbench.map((t) => ({ kind: "Workbench", t })),
    ...transports.customizing.map((t) => ({ kind: "Customizing", t })),
  ];
  const lines: string[] = [];
  for (const { kind, t } of allTargets) {
    const requests = targetRequests(t);
    if (requests.length === 0) continue;
    lines.push(`${kind} target ${t["tm:name"]} (${t["tm:desc"]}):`);
    lines.push(...requests);
  }
  if (lines.length === 0) return "No transport requests found for this user.";
  return lines.join("\n");
}

// Where-used

export function formatUsageReferences(references: ReadonlyArray<UsageReference>): string {
  if (references.length === 0) return "No usage references found.";
  const lines = references.map((r) => {
    const name = r["adtcore:name"] || r.objectIdentifier;
    return `- ${name} (${r["adtcore:type"] ?? "?"})`;
  });
  return `${references.length} usage reference(s):\n${lines.join("\n")}`;
}

// Lock

export function formatLock(lock: AdtLock): string {
  return [
    `Locked. lockHandle=${lock.LOCK_HANDLE}`,
    lock.CORRNR ? `Transport: ${lock.CORRNR} (${lock.CORRTEXT ?? ""})` : "Transport: (none)",
    lock.CORRUSER ? `Correction user: ${lock.CORRUSER}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Syntax check

export function formatProfileStatus(
  profiles: Record<string, import("../types.ts").AbapProfile>,
  activeProfile: string | null,
): string {
  const names = Object.keys(profiles);
  if (names.length === 0) {
    return "No SAP connection configured. Use the abap_setup tool to configure a system.";
  }
  const lines: string[] = [
    `${names.length} SAP profile${names.length === 1 ? "" : "s"} configured:`,
    "",
  ];
  for (const name of names) {
    const cfg = profiles[name];
    const marker = name === activeProfile ? "[active]" : "       ";
    lines.push(`${marker} ${name}: ${cfg.username}@${cfg.url}`);
    const extra = [
      cfg.client ? `client=${cfg.client}` : "",
      cfg.language ? `lang=${cfg.language}` : "",
      cfg.allowUnauthorized ? "insecure-tls" : "",
    ].filter(Boolean);
    if (extra.length > 0) lines.push(`       ${extra.join(", ")}`);
  }
  return lines.join("\n");
}

export function formatSyntaxCheck(results: ReadonlyArray<SyntaxCheckResult>): string {
  if (results.length === 0) return "No syntax errors found.";
  const lines = results.map(
    (r) => `- [${r.severity}] line ${r.line}: ${r.text}`,
  );
  return `${results.length} message(s):\n${lines.join("\n")}`;
}

// ATC

export function formatAtcResult(result: AtcWorkList): string {
  const findings = result.objects.flatMap((o) =>
    o.findings.map((f) => ({ object: o.name, objectType: o.type, ...f })),
  );
  if (findings.length === 0) {
    return "ATC analysis completed with no findings.";
  }
  const lines: string[] = [];
  for (const { object, objectType, checkTitle, messageTitle, priority, location } of findings) {
    const pos = location ? `line ${location.range?.start?.line ?? "?"}` : "";
    lines.push(
      `- [P${priority}] ${object} (${objectType}): ${checkTitle} — ${messageTitle} ${pos}`,
    );
  }
  lines.unshift(`${findings.length} ATC finding(s):`);
  return lines.join("\n");
}

// Dumps

export function formatDumps(feed: DumpsFeed): string {
  if (feed.dumps.length === 0) return "No runtime dumps found.";
  const lines = feed.dumps.map((d) => {
    const when = d.id ? ` [${d.id}]` : "";
    return `- ${d.type}${when}: ${d.text}`;
  });
  return `${feed.dumps.length} runtime dump(s):\n${lines.join("\n")}`;
}

// Traces

export function formatTraces(result: TraceResults): string {
  if (result.runs.length === 0) return "No traces found for this user.";
  const lines = result.runs.map((r) => {
    const obj = r.extendedData?.objectName
      ? ` (${r.extendedData.objectName})`
      : "";
    const state = r.extendedData?.state?.text ?? "";
    const runtime = r.extendedData?.runtime
      ? `${Math.round(r.extendedData.runtime)}s`
      : "";
    return `- ${r.title}${obj} [${state}] ${runtime} — id=${r.id}`;
  });
  return `${result.runs.length} trace(s):\n${lines.join("\n")}`;
}

export function formatTraceHitList(
  hitList: TraceHitList,
  statements: TraceStatementResponse,
): string {
  const lines: string[] = [];
  if (statements.statements.length > 0) {
    lines.push("Statements (aggregated call tree):");
    for (const s of statements.statements.slice(0, 50)) {
      lines.push(
        `  - ${s.description} — hits=${s.hitCount}, gross=${s.grossTime.time}ms`,
      );
    }
  }
  if (hitList.entries.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Hit list (hot spots):");
    const sorted = [...hitList.entries].sort(
      (a, b) => b.grossTime.time - a.grossTime.time,
    );
    for (const e of sorted.slice(0, 25)) {
      lines.push(
        `  - ${e.description} — hits=${e.hitCount}, gross=${e.grossTime.time}ms (${e.grossTime.percentage}%)`,
      );
    }
  }
  if (lines.length === 0) return "Trace has no statements or hit list entries.";
  return lines.join("\n");
}

// Transport details

export function formatTransportDetails(request: TransportRequest): string {
  const lines: string[] = [
    `Transport: ${request["tm:number"]}`,
    `Description: ${request["tm:desc"]}`,
    `Status: ${request["tm:status"]}`,
    `Owner: ${request["tm:owner"]}`,
  ];
  const ownObjects = (request.objects ?? []).map((o) =>
    `  - ${o["tm:name"]} (${o["tm:type"]})`,
  );
  if (ownObjects.length > 0) {
    lines.push("Objects:");
    lines.push(...ownObjects);
  }
  if (request.tasks.length > 0) {
    lines.push("Tasks:");
    for (const t of request.tasks) {
      lines.push(`  ${t["tm:number"]}: ${t["tm:desc"]}`);
      for (const o of t.objects ?? []) {
        lines.push(`    - ${o["tm:name"]} (${o["tm:type"]})`);
      }
    }
  }
  return lines.join("\n");
}

// Text elements

export function formatTextElements(
  result: TextElementsResult,
  category: string,
): string {
  if (result.textElements.length === 0) {
    return `No ${category} text elements found for ${result.programName}.`;
  }
  const lines = result.textElements.map((e) => {
    const extra = e.maxLength ? ` (max ${e.maxLength})` : "";
    return `- ${e.id} = ${e.text}${extra}`;
  });
  return `${result.textElements.length} ${category} text element(s) for ${result.programName}:\n${lines.join("\n")}`;
}
