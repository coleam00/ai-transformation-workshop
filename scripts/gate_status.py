"""Report the SonarCloud quality gate for the demo project.

Reads SONAR_TOKEN from the environment; never prints it.

    python scripts/gate_status.py [--wait]

--wait polls until the pending analysis finishes processing first.
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://sonarcloud.io"
PROJECT = "coleam00_archon-secure-demo"


def call(path, **params):
    url = f"{BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    token = os.environ.get("SONAR_TOKEN", "")
    if not token:
        sys.exit("SONAR_TOKEN is not set")
    req = urllib.request.Request(url)
    req.add_header(
        "Authorization",
        "Basic " + base64.b64encode(f"{token}:".encode()).decode(),
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_body": e.read().decode()[:300]}


def wait_for_processing(tries=15, delay=10):
    for _ in range(tries):
        cur = call("/api/ce/component", component=PROJECT).get("current", {})
        if cur.get("status") == "SUCCESS":
            return True
        time.sleep(delay)
    return False


def main():
    if "--wait" in sys.argv:
        print("  waiting for SonarCloud to finish processing...")
        if not wait_for_processing():
            print("  !! analysis did not finish in time")

    qg = call("/api/qualitygates/project_status", projectKey=PROJECT, branch="main")
    ps = qg.get("projectStatus", {})
    status = ps.get("status")
    print(f"  gate: {status}")
    for c in ps.get("conditions", []):
        print(f"    {c.get('status'):6} {c.get('metricKey'):28} actual={c.get('actualValue')}")

    res = call("/api/issues/search", componentKeys=PROJECT, branch="main",
               ps=100, issueStatuses="OPEN,CONFIRMED")
    vulns = [i for i in res.get("issues", []) if i.get("type") == "VULNERABILITY"]
    print(f"  vulnerabilities: {len(vulns)}")
    for i in vulns:
        comp = i.get("component", "").split(":")[-1]
        print(f"    {i.get('rule'):22} {comp}:{i.get('line')}")

    # Exit non-zero if the demo baseline is wrong, so the reset script can shout.
    ok = status == "ERROR" and len(vulns) == 3
    if not ok:
        print("  !! NOT the expected demo baseline (want gate ERROR with 3 vulnerabilities)")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
