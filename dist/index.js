// node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// src/options.ts
import path2 from "node:path";
import { normalizePath } from "vite";
var resolveOptions = (options) => {
  const themeRoot = options.themeRoot ?? "./";
  const sourceCodeDir = options.sourceCodeDir ?? "frontend";
  const entrypointsDir = options.entrypointsDir ?? normalizePath(path2.join(sourceCodeDir, "entrypoints"));
  const additionalEntrypoints = options.additionalEntrypoints ?? [];
  const snippetFile = options.snippetFile ?? "vite-tag.liquid";
  const versionNumbers = options.versionNumbers ?? false;
  const tunnel = options.tunnel ?? false;
  return {
    themeRoot,
    sourceCodeDir,
    entrypointsDir,
    additionalEntrypoints,
    snippetFile,
    versionNumbers,
    tunnel
  };
};

// src/config.ts
import path3 from "node:path";
import { normalizePath as normalizePath2 } from "vite";
import glob from "fast-glob";
import createDebugger from "debug";
var debug = createDebugger("vite-plugin-shopify:config");
function shopifyConfig(options) {
  return {
    name: "vite-plugin-shopify-config",
    config(config) {
      const host = config.server?.host ?? "localhost";
      const port = config.server?.port ?? 5173;
      const https = config.server?.https;
      const origin = config.server?.origin ?? "__shopify_vite_placeholder__";
      const defaultAliases = {
        "~": path3.resolve(options.sourceCodeDir),
        "@": path3.resolve(options.sourceCodeDir)
      };
      const input = glob.sync([
        normalizePath2(path3.join(options.entrypointsDir, "**/*")),
        ...options.additionalEntrypoints
      ], { onlyFiles: true });
      const generatedConfig = {
        // Use relative base path so to load imported assets from Shopify CDN
        base: config.base ?? "./",
        // Do not use "public" directory
        publicDir: config.publicDir ?? false,
        build: {
          // Output files to "assets" directory
          outDir: config.build?.outDir ?? path3.join(options.themeRoot, "assets"),
          // Do not use subfolder for static assets
          assetsDir: config.build?.assetsDir ?? "",
          // Configure bundle entry points
          rollupOptions: {
            input: config.build?.rollupOptions?.input ?? input
          },
          // Output manifest file for backend integration
          manifest: typeof config.build?.manifest === "string" ? config.build.manifest : true
        },
        resolve: {
          // Provide import alias to source code dir for convenience
          alias: Array.isArray(config.resolve?.alias) ? [
            ...config.resolve?.alias ?? [],
            ...Object.keys(defaultAliases).map((alias) => ({
              find: alias,
              replacement: defaultAliases[alias]
            }))
          ] : {
            ...defaultAliases,
            ...config.resolve?.alias
          }
        },
        server: {
          host,
          https,
          port,
          origin,
          hmr: config.server?.hmr === false ? false : {
            ...config.server?.hmr === true ? {} : config.server?.hmr
          }
        }
      };
      debug(generatedConfig);
      return generatedConfig;
    }
  };
}

// src/html.ts
import fs from "node:fs";
import path4 from "node:path";
import { normalizePath as normalizePath3 } from "vite";
import createDebugger2 from "debug";
import startTunnel from "@shopify/plugin-cloudflare/hooks/tunnel";
import { renderInfo, isTTY } from "@shopify/cli-kit/node/ui";

// src/constants.ts
var KNOWN_CSS_EXTENSIONS = [
  "css",
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss"
];
var CSS_EXTENSIONS_REGEX = new RegExp(
  `\\.(${KNOWN_CSS_EXTENSIONS.join("|")})(\\?.+)?$`
);

// src/html.ts
var debug2 = createDebugger2("vite-plugin-shopify:html");
function shopifyHTML(options) {
  let config;
  let viteDevServerUrl;
  let tunnelClient;
  let tunnelUrl;
  const viteTagSnippetPath = path4.resolve(options.themeRoot, `snippets/${options.snippetFile}`);
  const viteTagSnippetName = options.snippetFile.replace(/\.[^.]+$/, "");
  const viteTagSnippetPrefix = (config2) => viteTagDisclaimer + viteTagEntryPath(config2.resolve.alias, options.entrypointsDir, viteTagSnippetName);
  return {
    name: "vite-plugin-shopify-html",
    enforce: "post",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transform(code) {
      if (config.command === "serve") {
        return code.replace(/__shopify_vite_placeholder__/g, tunnelUrl ?? viteDevServerUrl);
      }
    },
    configureServer({ config: config2, middlewares, httpServer }) {
      const tunnelConfig = resolveTunnelConfig(options);
      if (tunnelConfig.frontendPort !== -1) {
        config2.server.port = tunnelConfig.frontendPort;
      }
      httpServer?.once("listening", () => {
        const address = httpServer?.address();
        const isAddressInfo = (x) => typeof x === "object";
        if (isAddressInfo(address)) {
          viteDevServerUrl = resolveDevServerUrl(address, config2);
          const reactPlugin = config2.plugins.find(
            (plugin) => plugin.name === "vite:react-babel" || plugin.name === "vite:react-refresh"
          );
          debug2({ address, viteDevServerUrl, tunnelConfig });
          setTimeout(() => {
            void (async () => {
              if (options.tunnel === false) {
                return;
              }
              if (tunnelConfig.frontendUrl !== "") {
                tunnelUrl = tunnelConfig.frontendUrl;
                isTTY() && renderInfo({ body: `${viteDevServerUrl} is tunneled to ${tunnelUrl}` });
                return;
              }
              const hook = await startTunnel({
                config: null,
                provider: "cloudflare",
                port: address.port
              });
              tunnelClient = hook.valueOrAbort();
              tunnelUrl = await pollTunnelUrl(tunnelClient);
              isTTY() && renderInfo({ body: `${viteDevServerUrl} is tunneled to ${tunnelUrl}` });
              const viteTagSnippetContent = viteTagSnippetPrefix(config2) + viteTagSnippetDev(tunnelUrl, options.entrypointsDir, reactPlugin);
              fs.writeFileSync(viteTagSnippetPath, viteTagSnippetContent);
            })();
          }, 100);
          const devSnippetContent = viteTagSnippetPrefix(config2) + viteTagSnippetDev(
            tunnelConfig.frontendUrl !== "" ? tunnelConfig.frontendUrl : viteDevServerUrl,
            options.entrypointsDir,
            reactPlugin
          );
          fs.writeFileSync(viteTagSnippetPath, devSnippetContent);
        }
      });
      httpServer?.on("close", () => {
        tunnelClient?.stopTunnel();
      });
      return () => middlewares.use((req, res, next) => {
        if (req.url === "/index.html") {
          res.statusCode = 404;
          res.end(
            fs.readFileSync(path4.join(__dirname, "dev-server-index.html")).toString()
          );
        }
        next();
      });
    },
    closeBundle() {
      if (config.command === "serve") {
        return;
      }
      const manifestOption = config.build?.manifest;
      const manifestFilePath = path4.resolve(
        options.themeRoot,
        `assets/${typeof manifestOption === "string" ? manifestOption : ".vite/manifest.json"}`
      );
      if (!fs.existsSync(manifestFilePath)) {
        return;
      }
      const manifest = JSON.parse(
        fs.readFileSync(manifestFilePath, "utf8")
      );
      const assetTags = [];
      Object.keys(manifest).forEach((src) => {
        const { file, isEntry, css, imports } = manifest[src];
        const ext = path4.extname(src);
        if (isEntry === true) {
          const entryName = normalizePath3(path4.relative(options.entrypointsDir, src));
          const entryPaths = [`/${src}`, entryName];
          const tagsForEntry = [];
          if (ext.match(CSS_EXTENSIONS_REGEX)) {
            tagsForEntry.push(stylesheetTag(file, options.versionNumbers));
          } else {
            tagsForEntry.push(scriptTag(file, options.versionNumbers));
            if (typeof imports !== "undefined" && imports.length > 0) {
              imports.forEach((importFilename) => {
                const chunk = manifest[importFilename];
                const { css: css2 } = chunk;
                tagsForEntry.push(preloadScriptTag(chunk.file, options.versionNumbers));
                if (css2 && css2.length > 0) {
                  css2.forEach((cssFileName) => {
                    tagsForEntry.push(stylesheetTag(cssFileName, options.versionNumbers));
                  });
                }
              });
            }
            if (css && css.length > 0) {
              css.forEach((cssFileName) => {
                tagsForEntry.push(stylesheetTag(cssFileName, options.versionNumbers));
              });
            }
          }
          assetTags.push(viteEntryTag(entryPaths, tagsForEntry.join("\n  "), assetTags.length === 0));
        }
        if (src === "style.css" && !config.build.cssCodeSplit) {
          assetTags.push(
            viteEntryTag([src], stylesheetTag(file, options.versionNumbers), false)
          );
        }
      });
      const viteTagSnippetContent = viteTagSnippetPrefix(config) + assetTags.join("\n") + "\n{% endif %}\n";
      fs.writeFileSync(viteTagSnippetPath, viteTagSnippetContent);
    }
  };
}
var viteTagDisclaimer = `{% comment %}
  IMPORTANT: This snippet is automatically generated by vite-plugin-shopify.
  Do not attempt to modify this file directly, as any changes will be overwritten by the next build.
{% endcomment %}
`;
var viteTagEntryPath = (resolveAlias, entrypointsDir, snippetName) => {
  const replacements = [];
  resolveAlias.forEach((alias) => {
    if (typeof alias.find === "string") {
      replacements.push([
        alias.find,
        normalizePath3(path4.relative(entrypointsDir, alias.replacement))
      ]);
    }
  });
  return `{% assign path = ${snippetName} | ${replacements.map(([from, to]) => `replace: '${from}/', '${to}/'`).join(" | ")} %}
{% assign script_defer = script_defer | default: true, allow_false: true %}
`;
};
var assetUrl = (fileName, versionNumbers) => {
  if (!versionNumbers) {
    return `'${fileName}' | asset_url | split: '?' | first`;
  }
  return `'${fileName}' | asset_url`;
};
var viteEntryTag = (entryPaths, tag, isFirstEntry = false) => `{% ${!isFirstEntry ? "els" : ""}if ${entryPaths.map((entryName) => `path == "${entryName}"`).join(" or ")} %}
  ${tag}`;
var preloadScriptTag = (fileName, versionNumbers) => `<link rel="modulepreload" href="{{ ${assetUrl(fileName, versionNumbers)} }}" crossorigin="anonymous">`;
function scriptTag(fileName, versionNumbers) {
  return `
{% if script_defer == false %}
<script src="{{ ${assetUrl(fileName, versionNumbers)} }}" type="module" crossorigin="anonymous"></script>
{% else %}
<script src="{{ ${assetUrl(fileName, versionNumbers)} }}" type="module" crossorigin="anonymous" defer></script>
{% endif %}
`.trim();
}
var stylesheetTag = (fileName, versionNumbers) => `{{ ${assetUrl(fileName, versionNumbers)} | stylesheet_tag: preload: preload_stylesheet }}`;
var viteTagSnippetDev = (assetHost, entrypointsDir, reactPlugin) => `{% liquid
  assign path_prefix = path | slice: 0
  if path_prefix == '/'
    assign file_url_prefix = '${assetHost}'
  else
    assign file_url_prefix = '${assetHost}/${entrypointsDir}/'
  endif
  assign file_url = path | prepend: file_url_prefix
  assign file_name = path | split: '/' | last
  if file_name contains '.'
    assign file_extension = file_name | split: '.' | last
  endif
  assign css_extensions = '${KNOWN_CSS_EXTENSIONS.join("|")}' | split: '|'
  assign is_css = false
  if css_extensions contains file_extension
    assign is_css = true
  endif
%}${reactPlugin === void 0 ? "" : `
<script src="${assetHost}/@id/__x00__vite-plugin-shopify:react-refresh" type="module"></script>`}
<script src="${assetHost}/@vite/client" type="module"></script>
{% if is_css == true %}
  <link rel="stylesheet" href="{{ file_url }}" crossorigin="anonymous">
{% else %}
  <script src="{{ file_url }}" type="module"></script>
{% endif %}
`;
function resolveDevServerUrl(address, config) {
  const configHmrProtocol = typeof config.server.hmr === "object" ? config.server.hmr.protocol : null;
  const clientProtocol = configHmrProtocol ? configHmrProtocol === "wss" ? "https" : "http" : null;
  const serverProtocol = config.server.https ? "https" : "http";
  const protocol = clientProtocol ?? serverProtocol;
  const configHmrHost = typeof config.server.hmr === "object" ? config.server.hmr.host : null;
  const configHost = typeof config.server.host === "string" ? config.server.host : null;
  const serverAddress = isIpv6(address) ? `[${address.address}]` : address.address;
  const host = configHmrHost ?? configHost ?? serverAddress;
  const configHmrClientPort = typeof config.server.hmr === "object" ? config.server.hmr.clientPort : null;
  const port = configHmrClientPort ?? address.port;
  return `${protocol}://${host}:${port}`;
}
function isIpv6(address) {
  return address.family === "IPv6" || // In node >=18.0 <18.4 this was an integer value.
  // See: https://github.com/laravel/vite-plugin/issues/103
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error-next-line
  address.family === 6;
}
function resolveTunnelConfig(options) {
  let frontendPort = -1;
  let frontendUrl = "";
  let usingLocalhost = false;
  if (options.tunnel === false) {
    usingLocalhost = true;
    return { frontendUrl, frontendPort, usingLocalhost };
  }
  if (options.tunnel === true) {
    return { frontendUrl, frontendPort, usingLocalhost };
  }
  const matches = options.tunnel.match(/(https:\/\/[^:]+):([0-9]+)/);
  if (matches === null) {
    throw new Error(`Invalid tunnel URL: ${options.tunnel}`);
  }
  frontendPort = Number(matches[2]);
  frontendUrl = matches[1];
  return { frontendUrl, frontendPort, usingLocalhost };
}
async function pollTunnelUrl(tunnelClient) {
  return await new Promise((resolve, reject) => {
    let retries = 0;
    const pollTunnelStatus = async () => {
      const result = tunnelClient.getTunnelStatus();
      debug2(`Polling tunnel status for ${tunnelClient.provider} (attempt ${retries}): ${result.status}`);
      if (result.status === "error") {
        return reject(result.message);
      }
      if (result.status === "connected") {
        resolve(result.url);
      } else {
        retries += 1;
        startPolling();
      }
    };
    const startPolling = () => {
      setTimeout(() => {
        void pollTunnelStatus();
      }, 500);
    };
    void pollTunnelStatus();
  });
}

// src/react-refresh.ts
function shopifyReactRefresh() {
  const virtualModuleId = "vite-plugin-shopify:react-refresh";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;
  return {
    name: "vite-plugin-shopify:react-refresh",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
          import RefreshRuntime from '__shopify_vite_placeholder__/@react-refresh'
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        `;
      }
    }
  };
}

// src/index.ts
var vitePluginShopify = (options = {}) => {
  const resolvedOptions = resolveOptions(options);
  const plugins = [
    // Apply plugin for configuring Vite settings
    shopifyConfig(resolvedOptions),
    // Apply plugin for generating HTML asset tags through vite-tag snippet
    shopifyHTML(resolvedOptions),
    // React refresh
    shopifyReactRefresh()
  ];
  return plugins;
};
var index_default = vitePluginShopify;
export {
  index_default as default
};
