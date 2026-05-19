import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(projectRoot, "dist");
const dataDir = join(projectRoot, "public", "data");
const outputPath = join(projectRoot, "standalone.html");

function escapeInlineScript(value) {
  return value.replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--");
}

function firstMatch(html, pattern, description) {
  const match = html.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Could not find ${description} in dist/index.html`);
  }
  return match[1];
}

const distHtml = await readFile(join(distDir, "index.html"), "utf8");
const scriptPath = firstMatch(distHtml, /<script[^>]+src="([^"]+)"[^>]*><\/script>/, "script asset");
const stylePath = firstMatch(distHtml, /<link[^>]+href="([^"]+)"[^>]*>/, "stylesheet asset");
const appScript = await readFile(join(distDir, scriptPath.replace(/^\//, "")), "utf8");
const appStyle = await readFile(join(distDir, stylePath.replace(/^\//, "")), "utf8");

const data = {
  "/data/survival_lookup.json": JSON.parse(await readFile(join(dataDir, "survival_lookup.json"), "utf8")),
  "/data/options.json": JSON.parse(await readFile(join(dataDir, "options.json"), "utf8")),
  "/data/metadata.json": JSON.parse(await readFile(join(dataDir, "metadata.json"), "utf8")),
};

const standaloneHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>头颈肿瘤生存图谱</title>
    <style>${appStyle}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.__HEAD_NECK_SURVIVAL_DATA__ = ${escapeInlineScript(JSON.stringify(data))};
      window.__HEAD_NECK_SURVIVAL_FETCH__ = window.fetch.bind(window);
      window.fetch = function(input, init) {
        const rawUrl = typeof input === "string" ? input : input && "url" in input ? input.url : String(input);
        const url = new URL(rawUrl, window.location.href);
        const dataKey = url.pathname.includes("/data/") ? "/data/" + url.pathname.split("/data/").at(-1) : url.pathname;
        const embedded = window.__HEAD_NECK_SURVIVAL_DATA__[dataKey];
        if (embedded !== undefined) {
          return Promise.resolve(new Response(JSON.stringify(embedded), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }));
        }
        return window.__HEAD_NECK_SURVIVAL_FETCH__(input, init);
      };
    </script>
    <script type="module">${escapeInlineScript(appScript)}</script>
  </body>
</html>
`;

await writeFile(outputPath, standaloneHtml, "utf8");
console.log(`Wrote ${outputPath}`);
