const SCAN_TOOL = "scan-repo-data";

const EXECUTABLE_TOOLS = new Set([
  "scan-repo",
  "find-symbol",
  "scan-repo-data",
]);

function findScanResult(results) {
  return results.find(
    (r) =>
      r?.toolId === SCAN_TOOL &&
      r.status === "EXECUTED" &&
      r.result &&
      typeof r.result === "object" &&
      r.result.ok === true,
  );
}

const FIND_TOOL = "find-symbol-data";

function findResult(results) {
  return results.find(
    (r) =>
      r?.toolId === FIND_TOOL &&
      r.status === "EXECUTED" &&
      r.result &&
      typeof r.result === "object" &&
      r.result.ok === true,
  );
}

function evaluateCriterion(criterion, results) {
  if (criterion === "scan.ok=true") {
    return Boolean(findScanResult(results));
  }

  if (criterion === "scan.fileCount>0") {
    const scan = findScanResult(results);
    return Boolean(
      scan &&
      Number.isFinite(scan.result.fileCount) &&
      scan.result.fileCount > 0,
    );
  }

  const threshold = criterion.match(
    /^scan\.fileCount>=(\d+)$/,
  );

  if (threshold) {
    const scan = findScanResult(results);
    return Boolean(
      scan &&
      Number.isFinite(scan.result.fileCount) &&
      scan.result.fileCount >= Number(threshold[1]),
    );
  }

  if (criterion === "find.ok=true") {
    return Boolean(findResult(results));
  }

  if (criterion === "find.count>0") {
    const found = findResult(results);
    return Boolean(
      found &&
        Number.isFinite(found.result.count) &&
        found.result.count > 0,
    );
  }

  const findThreshold = criterion.match(/^find\.count>=(\d+)$/);
  if (findThreshold) {
    const found = findResult(results);
    return Boolean(
      found &&
        Number.isFinite(found.result.count) &&
        found.result.count >= Number(findThreshold[1]),
    );
  }

  const executed = criterion.match(
    /^tool\.([a-z0-9-]+)\.executed$/,
  );

  if (executed && EXECUTABLE_TOOLS.has(executed[1])) {
    return results.some(
      (r) =>
        r?.toolId === executed[1] &&
        r.status === "EXECUTED",
    );
  }

  return false;
}

export function verifyGoalCriteria({
  criteria = [],
  results = [],
} = {}) {
  const checks = Array.isArray(criteria)
    ? criteria.slice(0, 10).map((value) => {
        const criterion = String(value);
        const passed = evaluateCriterion(criterion, results);

        return { criterion, passed };
      })
    : [];

  const passed =
    checks.length > 0 &&
    checks.every((check) => check.passed);

  return {
    passed,
    evidence: checks.map(
      ({ criterion, passed }) =>
        `criterion ${criterion}: ${
          passed ? "met" : "not met or unknown"
        }`,
    ),
  };
}
