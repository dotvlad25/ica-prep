"""
Local Python execution server for ICA Prep.
Runs on http://localhost:8000
"""
import subprocess
import sys
import tempfile
import os
import textwrap
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="ICA Prep Python Runner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    code: str
    timeout: Optional[int] = 10


class TestCase(BaseModel):
    description: str
    input: str
    expectedOutput: str


class TestRequest(BaseModel):
    base_class: str
    user_code: str
    test_cases: list[TestCase]
    timeout: Optional[int] = 10


def run_python(code: str, timeout: int = 10) -> dict:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write(code)
        fname = f.name
    try:
        result = subprocess.run(
            [sys.executable, fname],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "error": result.returncode != 0,
            "timedOut": False,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Timed out after {timeout}s", "returncode": -1, "error": True, "timedOut": True}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -1, "error": True, "timedOut": False}
    finally:
        os.unlink(fname)


@app.get("/api/health")
def health():
    return {"status": "ok", "python": sys.version}


@app.post("/api/run")
def run_code(req: RunRequest):
    return run_python(req.code, req.timeout or 10)


@app.post("/api/test")
def run_tests(req: TestRequest):
    results = []
    for tc in req.test_cases:
        # Build the full script: base_class + user_code + input lines
        full_code = textwrap.dedent(req.base_class or "") + "\n\n" + textwrap.dedent(req.user_code or "") + "\n\n" + tc.input
        res = run_python(full_code, req.timeout or 10)

        actual = res["stdout"].strip()
        expected = tc.expectedOutput.strip()
        passed = actual == expected and not res["error"]

        results.append({
            "description": tc.description,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "errorMsg": res["stderr"] if not passed else "",
        })
    return results


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("ICA_PORT", 8000))
    print(f"🐍 Python runner starting on http://localhost:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
