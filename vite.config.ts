import fs from "node:fs"
import path from "node:path"
import { type Plugin, mergeConfig } from "vite"
import baseConfig from "./vite.preview.config"
import dts from 'vite-plugin-dts'
/**
 * Patch generated entries and import their corresponding CSS files.
 */
const patchCssFiles: Plugin = {
  name: "patch-css",
  apply: "build",
  writeBundle() {
    //  inject css imports to the files
    const outDir = path.resolve("dist")
    ;["repl-react", "codemirror-editor"].forEach((file) => {
      const filePath = path.resolve(outDir, `${file}.js`)
      const content = fs.readFileSync(filePath, "utf-8")
      fs.writeFileSync(filePath, `import './${file}.css'\n${content}`)
    })
  },
}
export default mergeConfig(baseConfig, {
  plugins: [
    dts({
      rollupTypes: true,
    }),
    patchCssFiles
  ],
  optimizeDeps: {
    include: [
      'typescript'
    ],
    exclude: [
      '@swc/wasm-web'
    ]
  },
  base: './',
  build: {
    outDir: 'dist',
    target: "esnext",
    minify: false,
    lib: {
      entry: {
        "repl-react": "./src/index.ts",
        "codemirror-editor": "./src/components/Editor/CodeMirror/index.tsx",
      },
      formats: ["es"],
      fileName: () => "[name].js",
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
        manualChunks(id:string) {
          // id 中包含 codemirror-editor 的 style.css
          if (id.includes('CodeMirror') && id.endsWith('.css')) {
            return "codemirror-editor.css";  // 不打公共 chunk，独立输出
          }
        },
      },
    },
  },
})
