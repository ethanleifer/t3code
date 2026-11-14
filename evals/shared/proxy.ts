// Eval-only helper: it reads the local Codex config through python3 at startup.
// @effect-diagnostics nodeBuiltinImport:off
import * as NodeChildProcess from "node:child_process";
import * as Schema from "effect/Schema";

// Read credentials into memory only. Python's TOML parser avoids another runner dependency.
const decodeProxyConfig = Schema.decodeUnknownSync(
  Schema.Struct({ url: Schema.String, headers: Schema.Record(Schema.String, Schema.String) }),
);
/** Reads the named eval proxy, or the active custom Codex provider. */
export const proxyConfig = () =>
  decodeProxyConfig(
    JSON.parse(
      NodeChildProcess.execFileSync(
        "python3",
        [
          "-c",
          `
import json, os, pathlib, subprocess, tomllib
home = pathlib.Path.home() / '.codex'
config = tomllib.loads((home / 'config.toml').read_text())
providers = config.get('model_providers', {})
p = providers.get('vibeproxy') or providers[config['model_provider']]
h = p.get('http_headers', {}).copy()
h.update({k: os.environ[v] for k,v in p.get('env_http_headers', {}).items()})
key = os.environ[p['env_key']] if p.get('env_key') else p.get('experimental_bearer_token')
if not key and p.get('requires_openai_auth'): key = json.loads((home / 'auth.json').read_text()).get('OPENAI_API_KEY')
auth = p.get('auth')
if not key and auth:
    key = subprocess.check_output([auth['command'], *auth.get('args', [])], text=True, timeout=auth.get('timeout_ms', 10000) / 1000).strip()
if key: h['Authorization'] = 'Bearer ' + key
print(json.dumps({'url': p['base_url'].rstrip('/'), 'headers': h}))
`,
        ],
        { encoding: "utf8" },
      ),
    ),
  );
