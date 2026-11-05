const form = document.querySelector("#chatForm");
const textarea = document.querySelector("#prompt");
const messagesEl = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const sendButton = document.querySelector("#sendButton");
const historyEl = document.querySelector("#history");
let conversations = [];
let currentId = crypto.randomUUID();
let messages = [];
let busy = false;

function saveCurrent() {
  if (!messages.length) return;
  const title = messages.find(m => m.role === "user")?.content.slice(0, 42) || "Nova conversa";
  const existing = conversations.find(c => c.id === currentId);
  if (existing) Object.assign(existing, { title, messages: [...messages] });
  else conversations.unshift({ id: currentId, title, messages: [...messages] });
  conversations = conversations.slice(0, 30);
  renderHistory();
}
function renderHistory() {
  historyEl.innerHTML = "";
  conversations.forEach(c => {
    const b = document.createElement("button");
    b.textContent = c.title;
    b.className = c.id === currentId ? "active" : "";
    b.title = c.title;
    b.onclick = () => loadConversation(c.id);
    historyEl.append(b);
  });
}
function loadConversation(id) {
  saveCurrent();
  const c = conversations.find(x => x.id === id);
  if (!c) return;
  currentId = id;
  messages = [...c.messages];
  renderMessages();
  document.querySelector("#sidebar").classList.remove("open");
  renderHistory();
}
function newChat() {
  saveCurrent();
  currentId = crypto.randomUUID();
  messages = [];
  renderMessages();
  textarea.focus();
  renderHistory();
}
function addMessage(role, content, extraClass = "") {
  const row = document.createElement("div");
  row.className = `message ${role} ${extraClass}`;
  if (role === "assistant") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✳";
    row.append(avatar);
  }
  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = content;
  row.append(body);
  messagesEl.append(row);
  row.scrollIntoView({ behavior: "smooth", block: "end" });
  return row;
}
function renderMessages() {
  messagesEl.innerHTML = "";
  welcome.hidden = messages.length > 0;
  messages.forEach(m => addMessage(m.role, m.content));
}
async function sendMessage(text) {
  const content = text.trim();
  if (!content || busy) return;
  welcome.hidden = true;
  messages.push({ role: "user", content });
  addMessage("user", content);
  textarea.value = "";
  textarea.style.height = "auto";
  busy = true;
  sendButton.disabled = true;
  const typing = addMessage("assistant", "NOIR está pensando…", "typing");
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.slice(-24) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível obter uma resposta.");
    typing.remove();
    messages.push({ role: "assistant", content: data.answer });
    addMessage("assistant", data.answer);
    saveCurrent();
  } catch (err) {
    typing.remove();
    addMessage("assistant", err.message, "error");
    messages.pop();
  } finally {
    busy = false;
    sendButton.disabled = false;
    textarea.focus();
  }
}
form.addEventListener("submit", e => { e.preventDefault(); sendMessage(textarea.value); });
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
});
textarea.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});
document.querySelector("#newChat").addEventListener("click", newChat);
document.querySelector("#clearButton").addEventListener("click", newChat);
document.querySelector("#menuButton").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelectorAll(".suggestion").forEach(b => b.addEventListener("click", () => sendMessage(b.dataset.prompt)));
renderHistory();
// Progressive Web App: cacheia a interface e permite instalação em navegadores compatíveis.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
let installPrompt = null;
const installButton = document.querySelector("#installButton");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener("appinstalled", () => { installButton.hidden = true; });
