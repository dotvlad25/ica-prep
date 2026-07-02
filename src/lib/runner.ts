/**
 * Calls the local FastAPI Python execution server at /api/run and /api/test.
 */

export interface RunResult {
  stdout: string;
  stderr: string;
  returncode: number;
  error: boolean;
  timedOut: boolean;
}

export interface TestResult {
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  errorMsg: string;
}

export async function runCode(code: string): Promise<RunResult> {
  const res = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(`Runner error: ${res.status}`);
  return res.json() as Promise<RunResult>;
}

export interface TestCase {
  description: string;
  input: string;
  expectedOutput: string;
}

export async function runTests(
  baseClass: string,
  userCode: string,
  testCases: TestCase[],
): Promise<TestResult[]> {
  const res = await fetch('/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base_class: baseClass, user_code: userCode, test_cases: testCases }),
  });
  if (!res.ok) throw new Error(`Runner error: ${res.status}`);
  return res.json() as Promise<TestResult[]>;
}
