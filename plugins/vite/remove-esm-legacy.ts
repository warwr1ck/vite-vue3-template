import { HtmlTagDescriptor, IndexHtmlTransformHook, Plugin } from 'vite'
import legacy, { Options } from '@vitejs/plugin-legacy'

export default function removeModule (options?: Options & { removeEsmodules?: boolean }): Plugin {
  const plugins = legacy(options) as unknown as Plugin[]

  // 强制移除esmodule相关代码，兼容file://协议的跨域问题
  if (options && options.removeEsmodules) {
    const plugin = plugins.find(plugin => plugin.name === 'legacy-post-process')

    if (plugin) {
      const oldTransformIndexHtml = plugin.transformIndexHtml as IndexHtmlTransformHook
      plugin.transformIndexHtml = function (html, ctx) {
        const result = oldTransformIndexHtml(html, ctx)
        if (!result) return
        const { html: legacyHtml, tags } = result as { html: string; tags: HtmlTagDescriptor[] }
  
        // 移除script的nomodule特性
        tags.forEach(tag => {
          if (tag.attrs && tag.attrs.nomodule) {
            tag.attrs.nomodule = false
          }
        })
  
        return {
          // 去除esm相关信息
          html: legacyHtml.replace(/<script type="module" crossorigin(.*?)><\/script>/g, '')
            .replace(/<link rel="modulepreload"(.*?)>/g, '')
            .replace(/^\s*$(?:\r\n?|\n)/gm, '') + '\r\n',
          tags
        }
      }
    }
  }
  return plugins as unknown as Plugin
}