// Local, dependency-free preview of the delivered build. Run through the
// Windows launcher or `node scripts/preview.mjs` after `npm run build`.
import { createServer } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const host = '127.0.0.1'
const port = 4195
const url = 'http://127.0.0.1:4195/'
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function isInsideRoot(filename) {
  const localPath = relative(root, filename)
  return localPath !== '..' && !localPath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(localPath)
}

try {
  await stat(resolve(root, 'index.html'))
} catch {
  console.error('No se encontró la versión preparada en dist. Ejecutá npm run build y volvé a abrir CarsMotion.')
  process.exit(1)
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end('Método no permitido.')
    return
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, url).pathname)
    if (pathname.includes('\0') || pathname.includes('\\')) {
      response.writeHead(400)
      response.end('Dirección inválida.')
      return
    }
    const filename = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`)
    if (!isInsideRoot(filename) || !isInsideRoot(await realpath(filename))) {
      response.writeHead(403)
      response.end('Archivo no disponible.')
      return
    }
    const information = await stat(filename)
    if (!information.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' })
    response.writeHead(200, {
      'Content-Type': types[extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': information.size,
    })
    if (request.method === 'HEAD') response.end()
    else response.end(await readFile(filename))
  } catch (error) {
    if (response.headersSent) { response.destroy(); return }
    response.writeHead(error instanceof URIError || error instanceof TypeError ? 400 : 404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('No se encontró esa página en esta vista local.')
  }
})

server.on('error', error => {
  if (error.code === 'EADDRINUSE') console.error('El puerto 4195 está ocupado. Cerrá la vista local anterior y abrí CarsMotion nuevamente.')
  else console.error('No se pudo abrir la vista local. Cerrá otras vistas locales y volvé a intentarlo.')
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log(`\nCarsMotion está listo: ${url}\n`)
  console.log('Esta ventana mantiene la página disponible solo en tu computadora.')
  console.log('Cerrá la ventana o presioná Ctrl+C para finalizar.\n')
  if (process.platform === 'win32' && !process.argv.includes('--no-open')) {
    // The browser command is a literal local URL: no request or user input is
    // interpolated into the Windows command line.
    const browser = spawn('cmd.exe', ['/d', '/s', '/c', 'start "" "http://127.0.0.1:4195/"'], { windowsHide: true, stdio: 'ignore' })
    browser.on('error', () => console.log(`Abrí esta dirección en tu navegador: ${url}`))
    browser.unref()
  }
})

const stop = () => {
  server.close(() => process.exit(0))
  server.closeAllConnections()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
