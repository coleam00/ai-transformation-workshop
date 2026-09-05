"""Fail the build unless the SonarQube quality gate is green.

    python tools/quality-gate-guard.py [branch]

Exit 0 only when the gate status is OK. Anything else - ERROR, or a gate that
cannot be evaluated - is a failure, because "we could not tell" is not a pass.

There is no model in this. It reads one status and compares it to one value.
That is the whole reason it can sit in front of a pull request: an agent can
argue with a prompt, but it cannot argue with an exit code.

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
        sys.exit("quality-gate-guard: SONAR_TOKEN is not set")
    url = f"{HOST}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    req.add_header("Authorization",
                   "Basic " + base64.b64encode(f"{token}:".encode()).decode())
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def wait_for_analysis(tries=18, delay=10):
    for _ in range(tries):
        try:
            cur = api("/api/ce/component", component=PROJECT).get("current", {})
            if cur.get("status") == "SUCCESS":
                return True
            if cur.get("status") == "FAILED":
                sys.exit("quality-gate-guard: the analysis task failed on the server")
        except urllib.error.HTTPError:
            pass
        time.sleep(delay)
    return False


def main():
    # Two addressing modes, because the analysis this guard checks can be either
    # a branch analysis or a pull-request one:
    #
    #   quality-gate-guard.py main       branch analysis
    #   quality-gate-guard.py --pr 123   pull-request analysis
    #
    # A pull request is judged on NEW code only, so the gate needs new-code
    # conditions for this to mean anything. Without them every condition comes
    # back `None`, the status is OK, and this guard waves through a red PR.
    args = sys.argv[1:]
    scope = {}
    label = ""
    if args and args[0] == "--pr":
        if len(args) < 2 or not args[1].strip():
            sys.exit("quality-gate-guard: --pr needs a pull request number")
        scope = {"pullRequest": args[1].strip()}
        label = f"pull request #{args[1].strip()}"
    else:
        branch = args[0] if args else "main"
        scope = {"branch": branch}
        label = f"branch {branch}"

    print(f"quality-gate-guard: checking {label}")
    wait_for_analysis()

    ps = api("/api/qualitygates/project_status",
             projectKey=PROJECT, **scope).get("projectStatus", {})
    status = ps.get("status")

    for c in ps.get("conditions", []):
        print(f"  {str(c.get('status')):6} {str(c.get('metricKey')):30} "
              f"actual={c.get('actualValue')} threshold={c.get('errorThreshold')}")

    if status == "OK":
        print("quality-gate-guard: OK - the quality gate is green")
        return 0

    if status in (None, "NONE"):
        print(f"quality-gate-guard: FAILED - the gate did not evaluate (status {status!r}).")
        print("A gate that cannot answer is not a pass. Check the gate's conditions:"
              " mixing new-code conditions into a gate on a project with no new-code"
              " period leaves it unevaluable.")
        return 1

    print(f"quality-gate-guard: FAILED - quality gate status is {status}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
