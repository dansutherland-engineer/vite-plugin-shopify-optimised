import fs from 'node:fs'
import path from 'node:path'
import { AddressInfo } from 'node:net'
import { Manifest, Plugin, ResolvedConfig, normalizePath } from 'vite'
import createDebugger from 'debug'
import startTunnel from '@shopify/plugin-cloudflare/hooks/tunnel'
import { renderInfo, isTTY } from '@shopify/cli-kit/node/ui'

import { CSS_EXTENSIONS_REGEX, KNOWN_CSS_EXTENSIONS } from './constants'
import type { Options, DevServerUrl, FrontendURLResult } from './types'
import type { TunnelClient } from '@shopify/cli-kit/node/plugins/tunnel'

const debug = createDebugger('vite-plugin-shopify:html')

// Plugin for generating vite-tag liquid theme snippet with entry points for JS and CSS assets
export default function shopifyHTML(options: Required<Options>): Plugin {
  let config: ResolvedConfig
  let viteDevServerUrl: DevServerUrl
  let tunnelClient: TunnelClient | undefined
  let tunnelUrl: string | undefined

  const viteTagSnippetPath = path.resolve(options.themeRoot, `snippets/${options.snippetFile}`)
  const viteTagSnippetName = options.snippetFile.replace(/\.[^.]+$/, '')
  // This prefix is prepended to BOTH dev and production snippets
  const viteTagSnippetPrefix = (config: ResolvedConfig): string =>
    viteTagDisclaimer + viteTagEntryPath(config.resolve.alias, options.entrypointsDir, viteTagSnippetName)

  return {
    name: 'vite-plugin-shopify-html',
    enforce: 'post',
    configResolved(resolvedConfig) {
      // Store reference to resolved config
      config = resolvedConfig
    },
    transform(code) {
      if (config.command === 'serve') {
        // Replace placeholder with tunnel or dev server URL in dev mode
        return code.replace(/__shopify_vite_placeholder__/g, tunnelUrl ?? viteDevServerUrl)
      }
    },
    configureServer({ config, middlewares, httpServer }) {
      const tunnelConfig = resolveTunnelConfig(options)

      if (tunnelConfig.frontendPort !== -1) {
        config.server.port = tunnelConfig.frontendPort
      }

      httpServer?.once('listening', () => {
        const address = httpServer?.address()
        const isAddressInfo = (x: string | AddressInfo | null | undefined): x is AddressInfo =>
          typeof x === 'object'

        if (isAddressInfo(address)) {
          viteDevServerUrl = resolveDevServerUrl(address, config)
          const reactPlugin = config.plugins.find(plugin =>
            plugin.name === 'vite:react-babel' || plugin.name === 'vite:react-refresh'
          )

          debug({ address, viteDevServerUrl, tunnelConfig })

          // If using a tunnel, attempt to start it
          setTimeout(() => {
            void (async (): Promise<void> => {
              if (options.tunnel === false) {
                return
              }

              if (tunnelConfig.frontendUrl !== '') {
                // If a direct URL is provided, use that
                tunnelUrl = tunnelConfig.frontendUrl
                isTTY() && renderInfo({ body: `${viteDevServerUrl} is tunneled to ${tunnelUrl}` })
                return
              }

              // Otherwise, start a Cloudflare tunnel automatically
              const hook = await startTunnel({
                config: null,
                provider: 'cloudflare',
                port: address.port
              })
              tunnelClient = hook.valueOrAbort()
              tunnelUrl = await pollTunnelUrl(tunnelClient)
              isTTY() && renderInfo({ body: `${viteDevServerUrl} is tunneled to ${tunnelUrl}` })

              // Write the dev snippet with the newly discovered tunnel URL
              const viteTagSnippetContent = viteTagSnippetPrefix(config) +
                viteTagSnippetDev(tunnelUrl, options.entrypointsDir, reactPlugin)

              fs.writeFileSync(viteTagSnippetPath, viteTagSnippetContent)
            })()
          }, 100)

          // Write the dev snippet with either the provided URL or local dev server
          const devSnippetContent = viteTagSnippetPrefix(config) +
            viteTagSnippetDev(
              tunnelConfig.frontendUrl !== ''
                ? tunnelConfig.frontendUrl
                : viteDevServerUrl,
              options.entrypointsDir,
              reactPlugin
            )

          fs.writeFileSync(viteTagSnippetPath, devSnippetContent)
        }
      })

      httpServer?.on('close', () => {
        tunnelClient?.stopTunnel()
      })

      // Serve the dev-server-index.html page
      return () => middlewares.use((req, res, next) => {
        if (req.url === '/index.html') {
          res.statusCode = 404
          res.end(
            fs.readFileSync(path.join(__dirname, 'dev-server-index.html')).toString()
          )
        }
        next()
      })
    },
    closeBundle() {
      // Only run this logic in production (build) mode
      if (config.command === 'serve') {
        return
      }

      const manifestOption = config.build?.manifest
      const manifestFilePath = path.resolve(
        options.themeRoot,
        `assets/${typeof manifestOption === 'string' ? manifestOption : '.vite/manifest.json'}`
      )

      if (!fs.existsSync(manifestFilePath)) {
        return
      }

      const manifest = JSON.parse(
        fs.readFileSync(manifestFilePath, 'utf8')
      ) as Manifest

      const assetTags: string[] = []

      Object.keys(manifest).forEach((src) => {
        const { file, isEntry, css, imports } = manifest[src]
        const ext = path.extname(src)

        // Generate tags for JS and CSS entry points
        if (isEntry === true) {
          const entryName = normalizePath(path.relative(options.entrypointsDir, src))
          const entryPaths = [`/${src}`, entryName]
          const tagsForEntry = []

          if (ext.match(CSS_EXTENSIONS_REGEX)) {
            // This is a CSS entry
            tagsForEntry.push(stylesheetTag(file, options.versionNumbers))
          } else {
            // This is a JS entry => generate script tag
            tagsForEntry.push(scriptTag(file, options.versionNumbers))

            // Also handle imports (e.g. dynamically imported chunks)
            if (typeof imports !== 'undefined' && imports.length > 0) {
              imports.forEach((importFilename: string) => {
                const chunk = manifest[importFilename]
                const { css } = chunk
                // Preload the JS chunk
                tagsForEntry.push(preloadScriptTag(chunk.file, options.versionNumbers))
                // Any CSS imported by that chunk
                if (css && css.length > 0) {
                  css.forEach((cssFileName: string) => {
                    tagsForEntry.push(stylesheetTag(cssFileName, options.versionNumbers))
                  })
                }
              })
            }

            // If our main entry also has some direct CSS references
            if (css && css.length > 0) {
              css.forEach((cssFileName: string) => {
                tagsForEntry.push(stylesheetTag(cssFileName, options.versionNumbers))
              })
            }
          }

          // Combine tags for this entry
          assetTags.push(viteEntryTag(entryPaths, tagsForEntry.join('\n  '), assetTags.length === 0))
        }

        // If using a single .css file with cssCodeSplit off
        if (src === 'style.css' && !config.build.cssCodeSplit) {
          assetTags.push(
            viteEntryTag([src], stylesheetTag(file, options.versionNumbers), false)
          )
        }
      })

      // Build final snippet content for production
      const viteTagSnippetContent =
        viteTagSnippetPrefix(config) + assetTags.join('\n') + '\n{% endif %}\n'

      fs.writeFileSync(viteTagSnippetPath, viteTagSnippetContent)
    }
  }
}

const viteTagDisclaimer = `{% comment %}
  IMPORTANT: This snippet is automatically generated by vite-plugin-shopify.
  Do not attempt to modify this file directly, as any changes will be overwritten by the next build.
{% endcomment %}\n`

// ---------------------------------------------------------
//   1) Let Liquid know the "path" + set default script_defer
// ---------------------------------------------------------
const viteTagEntryPath = (
  resolveAlias: Array<{ find: string | RegExp, replacement: string }>,
  entrypointsDir: string,
  snippetName: string
): string => {
  const replacements: Array<[string, string]> = []

  resolveAlias.forEach((alias) => {
    if (typeof alias.find === 'string') {
      replacements.push([
        alias.find,
        normalizePath(path.relative(entrypointsDir, alias.replacement))
      ])
    }
  })

  // We add a line to default script_defer to false in production
  return `{% assign path = ${snippetName} | ${replacements
    .map(([from, to]) => `replace: '${from}/', '${to}/'`)
    .join(' | ')} %}
{% assign script_defer = script_defer | default: true %}
`
}

// ---------------------------------------------------------
//   2) Format final asset URLs (with or without versioning)
// ---------------------------------------------------------
const assetUrl = (fileName: string, versionNumbers: boolean): string => {
  if (!versionNumbers) {
    // remove query param for versionless
    return `'${fileName}' | asset_url | split: '?' | first`
  }
  return `'${fileName}' | asset_url`
}

// ---------------------------------------------------------
//   3) Liquid condition for picking the right entry block
// ---------------------------------------------------------
const viteEntryTag = (entryPaths: string[], tag: string, isFirstEntry = false): string =>
  `{% ${!isFirstEntry ? 'els' : ''}if ${entryPaths
    .map((entryName) => `path == "${entryName}"`)
    .join(' or ')} %}
  ${tag}`

// ---------------------------------------------------------
//   4) Preload link for a JS chunk in production
// ---------------------------------------------------------
const preloadScriptTag = (fileName: string, versionNumbers: boolean): string =>
  `<link rel="modulepreload" href="{{ ${assetUrl(fileName, versionNumbers)} }}" crossorigin="anonymous">`

// ---------------------------------------------------------
//   5) Production script tag (with Liquid defer logic)
// ---------------------------------------------------------
function scriptTag(
  fileName: string,
  versionNumbers: boolean
): string {
  // This snippet uses Liquid to conditionally add `defer` if script_defer is true
  return `
{% if script_defer == false %}
<script src="{{ ${assetUrl(fileName, versionNumbers)} }}" type="module" crossorigin="anonymous"></script>
{% else %}
<script src="{{ ${assetUrl(fileName, versionNumbers)} }}" type="module" crossorigin="anonymous" defer></script>
{% endif %}
`.trim()
}

// ---------------------------------------------------------
//   6) Production stylesheet link tag for a CSS asset
// ---------------------------------------------------------
const stylesheetTag = (fileName: string, versionNumbers: boolean): string =>
  `{{ ${assetUrl(fileName, versionNumbers)} | stylesheet_tag: preload: preload_stylesheet }}`

// ---------------------------------------------------------
//   7) Dev snippet (no "defer" logic here; dev is simpler)
// ---------------------------------------------------------
const viteTagSnippetDev = (
  assetHost: string,
  entrypointsDir: string,
  reactPlugin: Plugin | undefined
): string =>
  `{% liquid
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
  assign css_extensions = '${KNOWN_CSS_EXTENSIONS.join('|')}' | split: '|'
  assign is_css = false
  if css_extensions contains file_extension
    assign is_css = true
  endif
%}${reactPlugin === undefined
    ? ''
    : `
<script src="${assetHost}/@id/__x00__vite-plugin-shopify:react-refresh" type="module"></script>`}
<script src="${assetHost}/@vite/client" type="module"></script>
{% if is_css == true %}
  <link rel="stylesheet" href="{{ file_url }}" crossorigin="anonymous">
{% else %}
  <script src="{{ file_url }}" type="module"></script>
{% endif %}
`

/**
 * Resolve the dev server URL from the server address and configuration.
 */
function resolveDevServerUrl(address: AddressInfo, config: ResolvedConfig): DevServerUrl {
  const configHmrProtocol = typeof config.server.hmr === 'object' ? config.server.hmr.protocol : null
  const clientProtocol = configHmrProtocol
    ? configHmrProtocol === 'wss'
      ? 'https'
      : 'http'
    : null
  const serverProtocol = config.server.https ? 'https' : 'http'
  const protocol = clientProtocol ?? serverProtocol

  const configHmrHost = typeof config.server.hmr === 'object' ? config.server.hmr.host : null
  const configHost = typeof config.server.host === 'string' ? config.server.host : null
  const serverAddress = isIpv6(address) ? `[${address.address}]` : address.address
  const host = configHmrHost ?? configHost ?? serverAddress

  const configHmrClientPort = typeof config.server.hmr === 'object' ? config.server.hmr.clientPort : null
  const port = configHmrClientPort ?? address.port

  return `${protocol}://${host}:${port}`
}

function isIpv6(address: AddressInfo): boolean {
  return (
    address.family === 'IPv6' ||
    // In node >=18.0 <18.4 this was an integer value.
    // See: https://github.com/laravel/vite-plugin/issues/103
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error-next-line
    address.family === 6
  )
}

function resolveTunnelConfig(options: Required<Options>): FrontendURLResult {
  let frontendPort = -1
  let frontendUrl = ''
  let usingLocalhost = false

  if (options.tunnel === false) {
    usingLocalhost = true
    return { frontendUrl, frontendPort, usingLocalhost }
  }

  if (options.tunnel === true) {
    return { frontendUrl, frontendPort, usingLocalhost }
  }

  const matches = options.tunnel.match(/(https:\/\/[^:]+):([0-9]+)/)
  if (matches === null) {
    throw new Error(`Invalid tunnel URL: ${options.tunnel}`)
  }
  frontendPort = Number(matches[2])
  frontendUrl = matches[1]
  return { frontendUrl, frontendPort, usingLocalhost }
}

/**
 * Poll the tunnel provider every 0.5s until an URL or error is returned.
 */
async function pollTunnelUrl(tunnelClient: TunnelClient): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let retries = 0
    const pollTunnelStatus = async (): Promise<void> => {
      const result = tunnelClient.getTunnelStatus()
      debug(`Polling tunnel status for ${tunnelClient.provider} (attempt ${retries}): ${result.status}`)
      if (result.status === 'error') {
        return reject(result.message)
      }
      if (result.status === 'connected') {
        resolve(result.url)
      } else {
        retries += 1
        startPolling()
      }
    }

    const startPolling = (): void => {
      setTimeout(() => {
        void pollTunnelStatus()
      }, 500)
    }

    void pollTunnelStatus()
  })
}