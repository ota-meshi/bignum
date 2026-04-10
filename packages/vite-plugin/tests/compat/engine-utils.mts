/**
 * Check a subset of npm Node engine ranges used by Vite.
 * Unsupported syntax is treated as "not supported" so the related test is skipped.
 */
export function isNodeVersionSupported(
  range: string,
  version = process.versions.node,
): boolean {
  return range.split("||").some((part) => {
    return matchesComparatorSet(part.trim(), parseVersion(version));
  });
}

/**
 * Check whether a parsed version satisfies one comparator set.
 */
function matchesComparatorSet(range: string, version: number[]): boolean {
  if (range.startsWith(">=")) {
    return compareVersion(version, parseVersion(range.slice(2))) >= 0;
  }
  if (range.startsWith("^")) {
    const min = parseVersion(range.slice(1));
    const max = [min[0] + 1, 0, 0];
    return (
      compareVersion(version, min) >= 0 && compareVersion(version, max) < 0
    );
  }
  return false;
}

/**
 * Parse a Node version string like "24.14.0" into numeric parts.
 */
function parseVersion(version: string): number[] {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/u.exec(version.trim());
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`);
  }
  return match.slice(1).map((part) => Number(part));
}

/**
 * Compare two semantic version tuples.
 */
function compareVersion(left: number[], right: number[]): number {
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}
