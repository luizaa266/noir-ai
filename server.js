import "dotenv/config";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new Error("A mensagem ficou grande demais.");
  }
  return JSON.parse(raw || "{}");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && url.pathname === "/api/chat") {
    if (!process.env.OPENAI_API_KEY) {
      return send(res, 503, { error: "A API ainda não está configurada. Adicione OPENAI_API_KEY ao arquivo .env." });
    }
    try {
      const { messages } = await readBody(req);
      if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
        return send(res, 400, { error: "Envie uma conversa válida (até 40 mensagens)." });
      }
      const safeMessages = messages
        .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: "Você é NOIR, um assistente de IA útil, claro, curioso e amigável. Responda no idioma do usuário. Seja honesto quando não souber algo. Não afirme ser Claude ou outro sistema."
            },
            ...safeMessages
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data?.error?.message || `Erro do provedor (${response.status}).`;
        return send(res, response.status, { error: message });
      }
      const answer = data?.choices?.[0]?.message?.content;
      if (!answer) return send(res, 502, { error: "A IA não retornou uma resposta." });
      return send(res, 200, { answer });
    } catch (error) {
      return send(res, 500, { error: error.message || "Erro interno ao conversar com NOIR." });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { error: "Método não permitido." });
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) return send(res, 403, { error: "Acesso negado." });

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
    if (req.method === "HEAD") return res.end();
    return res.end(content);
  } catch {
    return send(res, 404, { error: "Página não encontrada." });
  }
});

server.listen(port, () => {
  console.log(`NOIR AI disponível em http://localhost:${port}`);
});