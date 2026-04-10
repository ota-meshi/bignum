import {
  transformAsync,
  type ParserOptions,
  type TransformOptions,
} from "@babel/core";
import bignumBabelPlugin from "@bignum/babel-plugin";

type BignumParserPlugin = NonNullable<ParserOptions["plugins"]>[number];

export type BignumViteBabelOptions = Omit<
  TransformOptions,
  | "ast"
  | "babelrc"
  | "configFile"
  | "filename"
  | "parserOpts"
  | "plugins"
  | "sourceFileName"
  | "sourceMaps"
> & {
  parserOpts?: ParserOptions;
};

export interface BignumVitePluginOptions {
  babel?: BignumViteBabelOptions;
}

export interface BignumViteTransformResult {
  code: string;
  map: object | null;
}

export interface BignumVitePlugin {
  enforce: "pre";
  name: "@bignum/vite-plugin";
  transform: (
    code: string,
    id: string,
  ) => Promise<BignumViteTransformResult | null>;
}

const BIGNUM_IMPORT_RE = /@bignum\/template(?:-light)?/u;
const SCRIPT_FILE_RE = /\.[cm]?[jt]sx?$/u;
const JSX_FILE_RE = /\.(?:[cm]?jsx|tsx)$/u;
const TS_FILE_RE = /\.(?:[cm]?ts|tsx)$/u;
const NON_SCRIPT_QUERY_RE =
  /(?:^|[&?])(?:raw|url|worker|sharedworker)(?:[&=]|$)/u;
const SCRIPT_QUERY_RE = /(?:^|[&?])type=script(?:[&=]|$)/u;
const LANG_QUERY_RE = /(?:^|[&?])lang(?:=|\.)([cm]?[jt]sx?)(?:&|$)/u;

/**
 * Build a Vite plugin that pre-compiles @bignum tagged templates.
 */
function bignum(options: BignumVitePluginOptions = {}): BignumVitePlugin {
  return {
    name: "@bignum/vite-plugin",
    enforce: "pre",
    async transform(code, id) {
      if (!shouldTransform(code, id)) {
        return null;
      }

      const babelOptions = options.babel ?? {};
      const result = await transformAsync(code, {
        ...babelOptions,
        babelrc: false,
        configFile: false,
        filename: stripQuery(id),
        parserOpts: buildParserOptions(id, babelOptions.parserOpts),
        plugins: [bignumBabelPlugin],
        sourceFileName: id,
        sourceMaps: true,
      });

      if (!result?.code) {
        return null;
      }
      return {
        code: result.code,
        map: result.map ?? null,
      };
    },
  };
}

export default bignum;

/** Skip files that are not relevant Vite script sources. */
function shouldTransform(code: string, id: string): boolean {
  if (!BIGNUM_IMPORT_RE.test(code)) {
    return false;
  }
  const query = getQuery(id);
  if (query && NON_SCRIPT_QUERY_RE.test(query)) {
    return false;
  }
  const filename = stripQuery(id);
  if (SCRIPT_FILE_RE.test(filename)) {
    return true;
  }
  return query ? SCRIPT_QUERY_RE.test(query) : false;
}

/** Merge required Babel parser plugins with any user-provided parser options. */
function buildParserOptions(
  id: string,
  parserOpts: ParserOptions | undefined,
): ParserOptions {
  const plugins = [...(parserOpts?.plugins ?? [])];

  addParserPlugin(plugins, "importAttributes");
  if (isJSXRequest(id)) {
    addParserPlugin(plugins, "jsx");
  }
  if (isTypeScriptRequest(id)) {
    addParserPlugin(plugins, "typescript");
  }

  return {
    ...parserOpts,
    plugins,
  };
}

/** Add a parser plugin once while preserving user-supplied plugins. */
function addParserPlugin(
  plugins: BignumParserPlugin[],
  plugin: BignumParserPlugin,
): void {
  const name = Array.isArray(plugin) ? plugin[0] : plugin;
  if (
    plugins.some((current) => {
      return (Array.isArray(current) ? current[0] : current) === name;
    })
  ) {
    return;
  }
  plugins.push(plugin);
}

/** Detect JSX requests from filenames and Vite virtual-module queries. */
function isJSXRequest(id: string): boolean {
  if (JSX_FILE_RE.test(stripQuery(id))) {
    return true;
  }
  const lang = LANG_QUERY_RE.exec(getQuery(id))?.[1];
  return lang != null && /^(?:[cm]?jsx|tsx)$/u.test(lang);
}

/** Detect TypeScript requests from filenames and Vite virtual-module queries. */
function isTypeScriptRequest(id: string): boolean {
  if (TS_FILE_RE.test(stripQuery(id))) {
    return true;
  }
  const lang = LANG_QUERY_RE.exec(getQuery(id))?.[1];
  return lang != null && /^(?:[cm]?ts|tsx)$/u.test(lang);
}

/** Remove any Vite query suffix before passing the filename to Babel. */
function stripQuery(id: string): string {
  const queryIndex = id.indexOf("?");
  return queryIndex < 0 ? id : id.slice(0, queryIndex);
}

/** Return the Vite query string without the leading question mark. */
function getQuery(id: string): string {
  const queryIndex = id.indexOf("?");
  return queryIndex < 0 ? "" : id.slice(queryIndex + 1);
}
