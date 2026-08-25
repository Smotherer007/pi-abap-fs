# pi ABAP FS

An [ABAP remote filesystem](https://github.com/marcellourbani/vscode_abap_remote_fs)-style
extension for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent).

It gives the pi agent **live access to an SAP system** via the ADT (ABAP Development
Tools) protocol: search and read real objects, edit and activate source code, run ABAP
unit tests, and query live tables — all through plain-language prompts.

This is a port of the core `vscode_abap_remote_fs` capabilities to pi. It is built on
[`abap-adt-api`](https://www.npmjs.com/package/abap-adt-api), the same ADT client
library the VS Code extension uses.

## Requirements

- pi coding agent (Node 26+)
- An SAP system with **ADT (ABAP Development Tools) enabled**
  - Reading/browsing works on NetWeaver 7.51+; writing on older systems may need the
    `abapfs_extensions` plugin (see upstream docs).

## Installation

```bash
pi install npm:@patimweb/pi-abap-fs
```

or run directly for a quick test:

```bash
pi -e ./index.ts
```

## Setup

1. Ask pi to configure a connection, or call the tool directly:

   ```
   Use abap_setup to configure my dev system:
   name=dev, url=http://vhcalnplci.bti.local:8000,
   username=DEVELOPER, password=..., client=001
   ```

   Credentials are stored in `~/.pi/abap-config.json` (mode `0600`, owner-readable only).

2. Verify the connection:

   ```
   Use abap_test_connection to check the dev profile.
   ```

## Tools

| Tool | Purpose |
|------|---------|
| `abap_setup` | Configure an SAP connection profile |
| `abap_status` | Show configured profiles and the active one |
| `abap_profile` | List / switch / delete profiles |
| `abap_test_connection` | Verify a profile can log on |
| `abap_search` | Search objects by name pattern |
| `abap_object_structure` | Object metadata and include list |
| `abap_read` | Read an object's source code |
| `abap_lock` / `abap_unlock` | Lock management |
| `abap_write` | Write source code (lock → write → unlock) |
| `abap_activate` | Activate an object |
| `abap_syntax_check` | Syntax-check source |
| `abap_unit_test` | Run ABAP unit tests |
| `abap_query` | Run an ABAP SQL query |
| `abap_table` | Preview table/view contents |
| `abap_where_used` | Where-used list |
| `abap_object_types` | List searchable object types |
| `abap_node_contents` | Browse a package's object tree |
| `abap_transports` | List transport requests |
| `abap_atc` | Run ATC analysis on an object |
| `abap_dumps` | List runtime dumps |
| `abap_traces` | List performance traces |
| `abap_trace_hitlist` | Analyze a performance trace |
| `abap_transport_details` | Details of one transport request |
| `abap_text_elements` | Read text elements (symbols/selections/headings) |
| `abap_set_text_elements` | Write text elements |
| `abap_create_object` | Create a new ABAP object |

## Example prompts

- "How does `ZCL_MY_CLASS` work?" — the agent searches, reads the source and
  related objects.
- "Find all classes with 'pricing' in the name."
- "Add method `calculate` to `ZCL_MY_CLASS` and activate it."
- "Run the unit tests for `ZCL_MY_CLASS` and explain the failures."
- "Show me the first 20 rows of table `SFLIGHT` where `CARRID = 'LH'`."

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # node --test over tests/**/*.test.ts
```

The extension is TypeScript loaded directly by pi (via jiti) — no build step.

## Release

Releases use [semantic-release](https://semantic-release.gitbook.io/semantic-release/)
on the `main` (and `next`) branches. Commits follow Conventional Commits; CI runs the
test suite, and the release workflow publishes to npm on merge.

## License

MIT
