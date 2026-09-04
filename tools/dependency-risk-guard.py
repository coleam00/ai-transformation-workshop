"""Fail the build if a change introduces new third-party dependency risk.

SonarQube Advanced Security knows which of your dependencies carry known
vulnerabilities. This turns that knowledge into a yes/no answer a pipeline can
act on, by comparing the count of at-risk dependencies before and after a change.

    python tools/dependency-risk-guard.py snapshot <file>   # before the change is analysed
    python tools/dependency-risk-guard.py check <file>      # after; exit 1 if the count rose

There is no model in this. It reads two numbers and compares them, which is the
only reason it can sit in front of a pull request.

Why a snapshot rather than SonarQube's own `newlyIntroduced` flag: that flag is
only computed for a branch measured against the project's main branch. An
analysis published as `main` has nothing to compare against, so every dependency
reads as pre-existing. Comparing two point-in-time counts works either way.

Reads SONAR_TOKEN from the environment. Project key and host come from
sonar-project.properties.
"""

import base64
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
METRICS = "sca_count_any_issue,sca_count_vulnerability,sca_count_malware"


def project_config():
    props = {}
    for line in (ROOT / "sonar-project.properties").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            props[k.strip()] = v.strip()
    return props.get("sonar.host.url", "https://sonarcloud.io").rstrip("/"), props["sonar.projectKey"]


HOST, PROJECT = project_config()


def api(path, **params):
    token = os.environ.get("SONAR_TOKEN", "")
    if not token:
        sys.exit("dependency-risk-guard: SONAR_TOKEN is not set")
    url = f"{HOST}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    req.add_header("Authorization",
                   "Basic " + base64.b64encode(f"{token}:".encode()).decode())
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def wait_for_analysis(tries=18, delay=10):
    """Dependency data only lands once the server finishes processing."""
    for _ in range(tries):
        try:
            cur = api("/api/ce/component", component=PROJECT).get("current", {})
            if cur.get("status") == "SUCCESS":
                return True
            if cur.get("status") == "FAILED":
                sys.exit("dependency-risk-guard: the analysis task failed on the server")
        except urllib.error.HTTPError:
            pass
        time.sleep(delay)
    return False


def counts(branch="main"):
    data = api("/api/measures/component", component=PROJECT, branch=branch,
               metricKeys=METRICS)
    out = {}
    for m in data.get("component", {}).get("measures", []):
        try:
            out[m["metric"]] = int(float(m.get("value") or 0))
        except (TypeError, ValueError):
            out[m["metric"]] = 0
    return {k: out.get(k, 0) for k in METRICS.split(",")}


def describe(c):
    return (f"{c['sca_count_any_issue']} at-risk dependencies "
            f"({c['sca_count_vulnerability']} vulnerability, "
            f"{c['sca_count_malware']} malware)")


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("snapshot", "check"):
        sys.exit(__doc__)
    mode, path = sys.argv[1], pathlib.Path(sys.argv[2])

    wait_for_analysis()
    current = counts()

    if mode == "snapshot":
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(current), encoding="utf-8")
        print(f"dependency-risk-guard: baseline recorded - {describe(current)}")
        return 0

    if not path.exists():
        sys.exit(f"dependency-risk-guard: no baseline at {path}; run snapshot first")
    baseline = json.loads(path.read_text(encoding="utf-8"))

    worse = {k: (baseline.get(k, 0), v) for k, v in current.items() if v > baseline.get(k, 0)}
    if not worse:
        print(f"dependency-risk-guard: OK - {describe(current)}, no increase over baseline")
        return 0

    print("dependency-risk-guard: FAILED - this change introduces dependency risk\n")
    for metric, (before, after) in sorted(worse.items()):
        print(f"  {metric}: {before} -> {after}  (+{after - before})")
    print(f"\n  baseline: {describe(baseline)}")
    print(f"  now:      {describe(current)}")
    print("\nThe dependency is reachable through something this change added. Resolve by"
          "\nupgrading it, pinning a patched version through a package.json override, or"
          "\nchoosing a dependency that does not carry it. Use the SonarQube MCP server's"
          "\nsearch_dependency_risks to see exactly which package and CVE.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
