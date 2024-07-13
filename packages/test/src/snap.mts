import path from "path";
import fs from "fs";
import assert from "assert";
import { format as prettyFormat } from "pretty-format";
import naturalCompare from "natural-compare";

const ARGV_UPDATE_SNAPSHOT =
  Boolean(process.env.UPDATE_SNAPSHOT) ||
  process.argv.includes("--update") ||
  process.argv.includes("--update-snapshot");
type SnapshotFile = {
  file: string;
  contents: Map<string, Map<number, string>>;
  updated?: boolean;
};
type SnapshotTitle = {
  title: string;
  seq: number;
};
type SnapshotContext = {
  snap: SnapshotFile;
  title: SnapshotTitle;
  titles: Map<string, SnapshotTitle>;
};
type SnapshotTester = {
  expect: (expect: any) => { toMatchSnapshot: () => void };
};
export const { expect } = setupSnap();

function setupSnap(): SnapshotTester {
  let ctx: SnapshotContext | null = null;
  const unusedTests = new Map<string, Map<string, Set<number>>>();

  beforeEach(function () {
    // eslint-disable-next-line no-invalid-this -- Mocha.Test
    const test = this.currentTest!;
    const parsed = path.parse(test.file!);
    const file = path.join(
      parsed.dir,
      "__snapshots__",
      `${parsed.name + parsed.ext}.snap`,
    );
    const titleKeys = [test.title];
    let parent = test.parent;
    while (parent) {
      if (parent.title) titleKeys.unshift(parent.title);
      parent = parent.parent;
    }
    const title = titleKeys.join(" ");

    if (ctx?.snap.file !== file) {
      if (ctx) saveIfNeeded(ctx.snap);
      ctx = {
        snap: ARGV_UPDATE_SNAPSHOT ? { file, contents: new Map() } : load(file),
        title: { title, seq: 0 },
        titles: new Map(),
      };
      if (!unusedTests.has(file)) {
        const unused = new Map<string, Set<number>>();
        unusedTests.set(file, unused);
        for (const [key, sequences] of ctx.snap.contents) {
          unused.set(key, new Set(sequences.keys()));
        }
      }
    } else if (ctx.title.title !== title) {
      let st = ctx.titles.get(title);
      if (!st) {
        st = { title, seq: 0 };
        ctx.titles.set(title, st);
      }
      ctx.title = st;
    }
  });
  after(() => {
    if (ctx) saveIfNeeded(ctx.snap);

    const reports: string[] = [];
    for (const [file, unused] of unusedTests) {
      const unusedKeys: string[] = [];
      for (const [key, sequences] of unused) {
        for (const seq of sequences) {
          unusedKeys.push(JSON.stringify(`${key} ${seq}`));
        }
      }
      if (unusedKeys.length) {
        reports.push(`Unused snapshots in ${file}:\n${unusedKeys.join("\n")}`);
      }
    }
    if (reports.length) {
      assert.fail(reports.join("\n"));
    }
  });

  return {
    expect(expect: any) {
      if (!ctx) throw new Error("Snapshot file not found");
      const { snap, title } = ctx;
      let str = prettyFormat(expect);
      if (str.includes("\n")) str = `\n${str}\n`;
      const key = title.title;
      const seq = ++title.seq;
      return {
        toMatchSnapshot: () => {
          unusedTests.get(snap.file)?.get(key)?.delete(seq);
          let content = snap.contents.get(key);
          if (!content) {
            content = new Map();
            snap.contents.set(key, content);
          }
          if (content.get(seq)) {
            assert.deepStrictEqual(content.get(seq), str);
          } else {
            content.set(seq, str);
            snap.updated = true;
          }
        },
      };
    },
  };
}

// function reportUnused(ctx: SnapshotContext) {
//   const unused: string[] = [];
//   for (const [key, sequences] of ctx.snap.unused) {
//     for (const seq of sequences) {
//       unused.push(`${key} ${seq}`);
//     }
//   }
//   if (unused.length) {
//     assert.fail(`Unused snapshots:\n${unused.join("\n")}`);
//   }
// }

function saveIfNeeded(snapshotFile: SnapshotFile) {
  if (!snapshotFile.updated) return;
  fs.writeFileSync(snapshotFile.file, stringifySnapshot(snapshotFile));
}

function load(filename: string): SnapshotFile {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const contents: Map<string, Map<number, string>> = fs.existsSync(filename)
    ? parseSnapshot(fs.readFileSync(filename, "utf8"))
    : new Map();
  return {
    file: filename,
    contents,
  };
}

function parseSnapshot(content: string): Map<string, Map<number, string>> {
  const result: Map<string, Map<number, string>> = new Map();
  Function(
    "exports",
    content,
  )(
    new Proxy(
      {},
      {
        set(_, key, value) {
          if (typeof key !== "string") return false;
          const splitted = key.split(" ");
          const seq = Number(splitted.pop());
          const testKey = splitted.join(" ");
          let list = result.get(testKey);
          if (!list) {
            list = new Map();
            result.set(testKey, list);
          }
          list.set(seq, value);
          return true;
        },
      },
    ),
  );
  return result;
}

function stringifySnapshot(snap: SnapshotFile): string {
  const content = [`// Snapshot v1`];
  for (const [key, values] of [...snap.contents].sort(([a], [b]) => {
    return naturalCompare(a, b);
  })) {
    for (const [index, value] of values) {
      content.push(
        `exports[\`${escape(key)} ${index + 1}\`] = \`${escape(value)}\`;`,
      );
    }
  }
  return `${content.join("\n\n")}\n`;

  function escape(str: string): string {
    return str.replace(/([\\`]|\$\{)/gu, "\\$1");
  }
}
