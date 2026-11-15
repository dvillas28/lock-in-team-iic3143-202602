"""Bootstrap y export equivalentes a los pasos Python de sonarqube-manual.yml."""
import base64, json, os, pathlib, secrets, sys, time, urllib.error, urllib.parse, urllib.request

base = os.environ["SONAR_HOST_URL"].rstrip("/")
project = os.environ["SONAR_PROJECT_KEY"]


def request(endpoint, password=None, token=None, data=None, **params):
    headers = {}
    if password is not None:
        headers["Authorization"] = "Basic " + base64.b64encode(f"admin:{password}".encode()).decode()
    if token is not None:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        body = urllib.parse.urlencode(data).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    url = f"{base}/api/{endpoint}" + ("?" + urllib.parse.urlencode(params) if params else "")
    with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=headers), timeout=60) as r:
        content = r.read()
        return json.loads(content) if content else None


def bootstrap():
    deadline = time.monotonic() + 900
    while time.monotonic() < deadline:
        try:
            if request("system/status")["status"] == "UP":
                break
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError):
            pass
        time.sleep(5)
    else:
        raise SystemExit("SonarQube no inició")
    password = "Ci1!" + secrets.token_hex(24)
    request("users/change_password", password="admin", data={"login": "admin", "previousPassword": "admin", "password": password})
    request("projects/create", password=password, data={"project": project, "name": "AcademiX", "visibility": "private"})
    print(request("user_tokens/generate", password=password, data={"name": "local", "type": "USER_TOKEN"})["token"])


def export(task_file, out):
    token = os.environ["SONAR_TOKEN"]
    out = pathlib.Path(out)
    save = lambda n, d: (out / n).write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")
    props = dict(l.split("=", 1) for l in pathlib.Path(task_file).read_text().splitlines() if "=" in l)
    while True:
        task = request("ce/task", token=token, id=props["ceTaskId"])["task"]
        if task["status"] == "SUCCESS":
            break
        if task["status"] in ("FAILED", "CANCELED"):
            raise SystemExit(task["status"])
        time.sleep(5)
    save("analysis-task.json", task)
    save("run.json", {"repository": "dvillas28/lock-in-team-iic3143-202602", "sha": os.environ.get("SHA"),
                      "image": os.environ["SONAR_IMAGE"], "server": request("system/status"), "ephemeral": True, "local": True})
    gate = request("qualitygates/project_status", token=token, analysisId=task["analysisId"])
    save("quality-gate.json", gate)
    measures = request("measures/component", token=token, component=project, metricKeys="ncloc,coverage,duplicated_lines_density")
    save("metrics.json", measures)
    issues, page = [], 1
    while True:
        res = request("issues/search", token=token, componentKeys=project, resolved="false", ps=500, p=page)
        issues.extend(res["issues"])
        if len(issues) >= res["paging"]["total"] or not res["issues"]:
            break
        page += 1
    save("issues.json", {"total": res["paging"]["total"], "issues": issues})
    print("gate", gate["projectStatus"]["status"], "issues", res["paging"]["total"],
          {m["metric"]: m.get("value") for m in measures["component"]["measures"]})


if __name__ == "__main__":
    bootstrap() if sys.argv[1] == "bootstrap" else export(sys.argv[2], sys.argv[3])
