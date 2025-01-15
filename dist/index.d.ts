import { Plugin } from 'vite';

interface Options {
    /**
     * Root path to your Shopify theme directory.
     *
     * @default './'
     */
    themeRoot?: string;
    /**
     * Front-end entry points directory.
     *
     * @default 'frontend/entrypoints'
     */
    entrypointsDir?: string;
    /**
     * Additional files to use as entry points (accepts an array of file paths or glob patterns).
     *
     * @default []
     */
    additionalEntrypoints?: string[];
    /**
     * Front-end source code directory.
     *
     * @default 'frontend'
     */
    sourceCodeDir?: string;
    /**
     * Specifies the file name of the snippet that loads your assets.
     *
     * @default 'vite-tag.liquid'
     */
    snippetFile?: string;
    /**
     * Specifies whether to append version numbers to your production-ready asset URLs in {@link snippetFile}.
     *
     * @default false
     */
    versionNumbers?: boolean;
    /**
     * Enables the creation of Cloudflare tunnels during dev, allowing previews from any device.
     *
     * @default false
     */
    tunnel?: boolean | string;
}

declare const vitePluginShopify: (options?: Options) => Plugin[];

export { vitePluginShopify as default };
