# Architecture

The extension bridges two worlds: the agent speaks tool calls, SAP speaks
ADT-REST. In between lie four layers with clear responsibilities.

## Layers

```mermaid
flowchart TB
    agent["pi coding agent<br/><small>LLM · tool runtime</small>"]
    index["index.ts<br/><small>loadConfig() + 27 × registerTool</small>"]
    tools["src/tools/*.ts<br/><small>27 modules: typebox schema + execute()</small>"]
    client["src/client.ts<br/><small>withClient() · resolveObject() · toError()</small>"]
    api["abap-adt-api<br/><small>ADTClient, stateless/stateful</small>"]
    sap[("SAP S/4HANA<br/><small>/sap/bc/adt/…</small>")]

    config["src/config.ts<br/><small>profiles + active profile</small>"]
    file[/"~/.pi/abap-config.json<br/><small>0600 · atomic rename</small>"/]
    fmt["src/formatting/formatters.ts<br/><small>pure: data → text</small>"]

    agent -->|"loads extension at startup"| index
    index -->|"registerTool × 27"| tools
    tools -->|"withClient(profile, fn)"| client
    client -->|"login → operation → dropSession"| api
    api -->|"HTTP(S), Basic Auth, client + language"| sap
    sap -.->|"response (XML/JSON)"| client

    config -->|"resolveConfig(profile)"| tools
    config <-->|"load / persist"| file
    client -->|"raw data"| fmt
    fmt -.->|"formatted text"| tools
```

The downward path is the call path; the dashed edges are the return path: raw
ADT responses pass through the pure formatters and leave the tool as text plus a
structured `details` object. `src/types.ts` deliberately sits beside the flow,
which is why it is absent from the diagram — it holds only data shapes and error
classes, no behavior.

## Flow of a write operation (`abap_write`)

Writing requires a lock, and the lock only holds within *one* stateful session.
Hence `stateful: true`, and hence `unLock` sits in a `finally`.

```mermaid
sequenceDiagram
    autonumber
    participant A as Agent
    participant T as abap_write
    participant C as client.ts
    participant S as SAP · ADT

    A->>T: abap_write(name, source, transport?)
    T->>T: resolveConfig(profile)
    T->>C: withClient(fn, { stateful: true })

    rect rgba(13,108,118,0.08)
    note over C,S: one session
    C->>S: login()
    C->>S: searchObject → objectStructure
    note right of C: resolveObject: best name match, mainInclude
    C->>S: lock(objectUrl, "MODIFY")
    S-->>C: LOCK_HANDLE
    C->>S: setObjectSource(mainInclude, source, handle, transport?)
    C->>S: unLock()  «finally»
    C->>S: dropSession()
    end

    T-->>A: "Source written …" + details
```

If a `lockHandle` from an earlier `abap_lock` is supplied, `lock` and `unLock`
are skipped — the lock then belongs to the caller and stays in place. Activation
is never automatic: `abap_activate` is a separate call.

## Tools by task

| Group | Tools |
|---|---|
| Connection | `abap_setup`, `abap_status`, `abap_profile`, `abap_test_connection` |
| Search & read | `abap_search`, `abap_object_types`, `abap_node_contents`, `abap_object_structure`, `abap_read`, `abap_where_used`, `abap_text_elements` |
| Modify | `abap_lock`, `abap_unlock`, `abap_write`, `abap_activate`, `abap_create_object`, `abap_set_text_elements` |
| Check & test | `abap_syntax_check`, `abap_unit_test`, `abap_atc` |
| Data | `abap_query`, `abap_table` |
| Operations & transport | `abap_transports`, `abap_transport_details`, `abap_dumps`, `abap_traces`, `abap_trace_hitlist` |

## Decisions

- **Session per call** (`withClient`) — fresh client, login, `dropSession` in the
  `finally`. No shared connection state between tools.
- **stateless as the default** — only locking operations run `stateful`.
- **Errors are normalized** (`toError`) — the model sees the SAP message
  directly; dedicated error classes say what to do next (e.g. "run `abap_setup`
  first").
- **Profile file written atomically** — temp file with `0600` and `rename`,
  because `writeFileSync` with `mode` does not change the permissions of an
  existing file.
- **Side-effect-free formatters** — data in, string out; which is why most of
  the code is testable without an SAP system.
- **No build step** — pi loads `index.ts` via jiti; `tsc` only runs as a
  `--noEmit` typecheck.
