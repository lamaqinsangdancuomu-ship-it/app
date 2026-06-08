/* ============================================================================
 * 不离手账 · Service Worker（自更新版）
 *
 * 解决“部署后看不到更新”的老问题：
 *   - 页面 / .js / .css ：网络优先 —— 在线时永远加载最新代码，离线时回退缓存。
 *   - 图片 / 字体等资源：缓存优先 —— 打开更快，且离线可用。
 *   - skipWaiting + clients.claim：新版本立即接管，无需手动清缓存。
 *
 * 注意：本 Service Worker 只负责“静态文件的缓存与离线”，从不接触你的笔记、
 * 供灯佛像、遍地花开照片等数据（它们保存在 localStorage / IndexedDB 中），
 * 也不接触仓库 assets/ 里的任何图片资源。更换本文件不会丢失任何内容。
 *
 * 今后若想强制清空全部缓存，只改下面 VERSION 即可。
 * ==========================================================================*/

const VERSION = "20260608-1";
const SHELL_CACHE = "buli-shell-" + VERSION;
const RUNTIME_CACHE = "buli-runtime-" + VERSION;

// 应用外壳：相对路径，兼容 GitHub Pages 子目录部署
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  // 仅处理同源请求；第三方请求交给浏览器自行处理
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isCode = /\.(?:js|css|webmanifest|html)$/i.test(url.pathname);

  // —— 网络优先：页面与代码文件 ——
  if (isNavigation || isCode) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // —— 缓存优先：图片 / 字体 / 其他静态资源 ——
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
