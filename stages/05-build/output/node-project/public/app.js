const state = { boxes: [], books: [], token: localStorage.getItem("lll.operatorToken") ?? "", candidate: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const empty = () => $("#empty-template").content.cloneNode(true);

function toast(message) {
  const element = $("#toast"); element.textContent = message; element.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

async function api(path, options = {}) {
  const headers = { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers ?? {}) };
  if (options.manage !== false && state.token) headers.authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? `Request failed (${response.status})`);
  return payload;
}

function optional(value) { const clean = String(value ?? "").trim(); return clean ? clean : null; }
function coordinates(form) {
  const latitude = form.latitude.value === "" ? null : Number(form.latitude.value);
  const longitude = form.longitude.value === "" ? null : Number(form.longitude.value);
  return { latitude, longitude };
}

async function load() {
  const [health, meta, boxes, books] = await Promise.all([
    api("/health", { manage: false }), api("/api/meta", { manage: false }),
    api("/api/boxes?limit=50", { manage: false }), api("/api/books?limit=50", { manage: false })
  ]);
  $("#node-name").textContent = meta.name;
  $("#node-health").textContent = health.status;
  state.boxes = boxes.data; state.books = books.data;
  $("#box-count").textContent = boxes.pagination.total;
  $("#book-count").textContent = books.pagination.total;
  renderBoxes(); renderBooks(state.books); populateBoxes(); updateAccess();
}

async function loadManaged() {
  if (!state.token) return load();
  try {
    const [boxes, books] = await Promise.all([api("/api/manage/boxes?limit=50"), api("/api/manage/books?limit=50")]);
    state.boxes = boxes.data; state.books = books.data; $("#box-count").textContent = boxes.pagination.total; $("#book-count").textContent = books.pagination.total; renderBoxes(); renderBooks(state.books); populateBoxes(); updateAccess();
  } catch (error) { state.token = ""; localStorage.removeItem("lll.operatorToken"); updateAccess(); throw error; }
}

function updateAccess() {
  $("#operator-button").textContent = state.token ? "Operator connected" : "Operator access";
  $("#operator-button").classList.toggle("button-primary", Boolean(state.token));
}

function boxCard(box) {
  const article = document.createElement("article"); article.className = "box-card";
  const count = box.bookCount ?? state.books.filter(book => (book.boxId ?? book.libraryBoxId) === box.id).length;
  article.innerHTML = `<div class="box-card-art"></div><div class="box-card-body"><p class="eyebrow">${box.visibility === "private" ? "Private box" : "Public box"}</p><h3>${escapeHtml(box.name)}</h3><p>${escapeHtml(box.description || "A little shelf waiting for its next story.")}</p><div class="box-meta"><span>${escapeHtml(box.location || "Location not published")}</span><strong>${count} book${count === 1 ? "" : "s"}</strong></div>${state.token ? `<div class="book-actions"><button class="icon-button" data-edit-box="${box.id}" aria-label="Edit ${escapeHtml(box.name)}">✎</button><button class="icon-button" data-delete-box="${box.id}" aria-label="Delete ${escapeHtml(box.name)}">×</button></div>` : ""}</div>`;
  return article;
}

function renderBoxes() {
  const grid = $("#box-grid"); grid.replaceChildren();
  if (!state.boxes.length) grid.append(empty()); else state.boxes.forEach(box => grid.append(boxCard(box)));
  const map = $("#map-pins"); map.replaceChildren();
  state.boxes.filter(box => box.latitude !== null && box.longitude !== null).forEach(box => {
    const pin = document.createElement("button"); pin.className = "map-pin"; pin.title = box.name;
    pin.style.left = `${((Number(box.longitude) + 180) / 360) * 94 + 3}%`;
    pin.style.top = `${((90 - Number(box.latitude)) / 180) * 88 + 6}%`; pin.innerHTML = "<span>⌂</span>"; map.append(pin);
  });
  if (!map.children.length) map.append(empty());
}

function renderBooks(books, mode) {
  const list = $("#book-list"); list.replaceChildren();
  if (!books.length) list.append(empty());
  books.forEach(book => {
    const boxId = book.boxId ?? book.libraryBoxId; const box = state.boxes.find(item => item.id === boxId);
    const article = document.createElement("article"); article.className = "book-card";
    article.innerHTML = `<div class="book-spine"></div><div><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.author)} · ${escapeHtml(box?.name ?? "Unboxed")}${book.genre ? ` · ${escapeHtml(book.genre)}` : ""}</p></div>${state.token ? `<div class="book-actions"><button class="icon-button" data-edit-book="${book.id}" aria-label="Edit ${escapeHtml(book.title)}">✎</button><button class="icon-button" data-delete-book="${book.id}" aria-label="Delete ${escapeHtml(book.title)}">×</button></div>` : ""}`;
    list.append(article);
  });
  if (mode) $("#search-note").textContent = mode === "semantic" ? "Semantic results from OpenAI embeddings stored in local sqlite-vec." : mode === "keyword_fallback" ? "OpenAI or vectors were unavailable, so the node returned keyword results." : "Keyword results from the local catalog.";
}

function populateBoxes() {
  const options = `<option value="">Choose a box</option>${state.boxes.map(box => `<option value="${box.id}">${escapeHtml(box.name)}</option>`).join("")}`;
  $("#scan-box").innerHTML = options; $("#search-box").innerHTML = `<option value="">Every box</option>${options.replace('<option value="">Choose a box</option>', "")}`;
  $$(".box-options").forEach(select => select.innerHTML = options);
}

function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
function requireOperator(action) { if (state.token) return action(); openDialog("access-dialog"); }

$("#operator-button").addEventListener("click", () => openDialog("access-dialog"));
$("#access-form").addEventListener("submit", async event => {
  event.preventDefault(); state.token = $("#operator-token").value; localStorage.setItem("lll.operatorToken", state.token);
  try { await loadManaged(); $("#access-dialog").close(); toast("Operator access connected"); } catch (error) { toast(error.message); }
});

$$('[data-dialog]').forEach(button => button.addEventListener("click", () => requireOperator(() => { const form = document.getElementById(button.dataset.dialog.replace("-dialog", "-form")); form?.reset(); if (form) delete form.dataset.editId; openDialog(button.dataset.dialog); })));
$$('.dialog-close').forEach(button => button.addEventListener("click", event => { event.preventDefault(); button.closest("dialog").close(); }));

$("#box-form").addEventListener("submit", async event => {
  event.preventDefault(); const form = event.currentTarget; const payload = { name: form.name.value.trim(), description: optional(form.description.value), location: optional(form.location.value), ...coordinates(form), visibility: form.visibility.value };
  try { await api(form.dataset.editId ? `/api/manage/boxes/${form.dataset.editId}` : "/api/manage/boxes", { method: form.dataset.editId ? "PATCH" : "POST", body: payload }); form.closest("dialog").close(); await loadManaged(); toast(form.dataset.editId ? "Box updated" : "Box created"); } catch (error) { $(".form-status", form).textContent = error.message; }
});

function bookPayload(form) { return { boxId: form.boxId.value, title: form.title.value.trim(), author: form.author.value.trim(), isbn: optional(form.isbn.value), genre: optional(form.genre.value), description: optional(form.description.value), language: optional(form.language.value), condition: optional(form.condition.value), visibility: "public", aiProvenance: null }; }
$("#book-form").addEventListener("submit", async event => {
  event.preventDefault(); const form = event.currentTarget;
  try { await api(form.dataset.editId ? `/api/manage/books/${form.dataset.editId}` : "/api/manage/books", { method: form.dataset.editId ? "PATCH" : "POST", body: bookPayload(form) }); form.closest("dialog").close(); await loadManaged(); toast(form.dataset.editId ? "Book updated" : "Book added"); } catch (error) { $(".form-status", form).textContent = error.message; }
});

document.addEventListener("click", async event => {
  const target = event.target.closest("button"); if (!target) return;
  if (target.dataset.editBox) { const box = state.boxes.find(item => item.id === target.dataset.editBox); const form = $("#box-form"); form.reset(); form.dataset.editId = box.id; ["name","description","location","latitude","longitude","visibility"].forEach(key => form[key].value = box[key] ?? ""); openDialog("box-dialog"); }
  if (target.dataset.deleteBox && confirm("Delete this empty box?")) { try { await api(`/api/manage/boxes/${target.dataset.deleteBox}`, { method: "DELETE" }); await loadManaged(); toast("Box deleted"); } catch (error) { toast(error.message); } }
  if (target.dataset.editBook) { const book = state.books.find(item => item.id === target.dataset.editBook); const form = $("#book-form"); form.reset(); form.dataset.editId = book.id; ["boxId","title","author","isbn","genre","description","language","condition"].forEach(key => form[key].value = book[key] ?? ""); openDialog("book-dialog"); }
  if (target.dataset.deleteBook && confirm("Delete this book and its search vector?")) { try { await api(`/api/manage/books/${target.dataset.deleteBook}`, { method: "DELETE" }); await loadManaged(); toast("Book deleted"); } catch (error) { toast(error.message); } }
});

$("#seed-button").addEventListener("click", () => requireOperator(async () => { try { await api("/api/manage/demo/seed", { method: "POST", body: {} }); await loadManaged(); toast("Demo library ready"); } catch (error) { toast(error.message); } }));
$$('[data-view]').forEach(button => button.addEventListener("click", () => { $$('[data-view]').forEach(item => item.classList.toggle("active", item === button)); $("#box-grid").classList.toggle("hidden", button.dataset.view !== "cards"); $("#box-map").classList.toggle("hidden", button.dataset.view !== "map"); }));

$("#search-form").addEventListener("submit", async event => { event.preventDefault(); const query = new URLSearchParams({ q: $("#search-query").value }); if ($("#search-box").value) query.set("boxId", $("#search-box").value); try { const result = await api(`/api/search?${query}`, { manage: false }); renderBooks(result.data, result.mode); } catch (error) { toast(error.message); } });

$("#scan-form").addEventListener("submit", async event => {
  event.preventDefault(); return requireOperator(async () => { const file = $("#scan-image").files[0]; const status = $("#scan-status"); if (!file) return; status.textContent = "GPT-5.6 is preparing an editable candidate…";
    try { const imageBase64 = await fileBase64(file); const candidate = await api("/api/manage/candidates/analyze", { method: "POST", body: { boxId: $("#scan-box").value, mimeType: file.type, imageBase64 } }); state.candidate = candidate; fillCandidate(candidate); status.textContent = ""; openDialog("candidate-dialog"); } catch (error) { status.textContent = error.message; }
  });
});

function fillCandidate(candidate) { const form = $("#candidate-form"); form.reset(); form.dataset.idempotencyKey = crypto.randomUUID(); form.candidateId.value = candidate.id; form.boxId.value = candidate.boxId; Object.entries(candidate.fields).forEach(([key,value]) => { if (form[key]) form[key].value = value ?? ""; }); }
function candidatePayload(form) { return { title: form.title.value.trim(), author: form.author.value.trim(), isbn: optional(form.isbn.value), genre: optional(form.genre.value), description: optional(form.description.value), language: optional(form.language.value), condition: optional(form.condition.value) }; }
$("#candidate-form").addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; try { await api(`/api/manage/candidates/${form.candidateId.value}`, { method: "PATCH", body: candidatePayload(form) }); await api(`/api/manage/candidates/${form.candidateId.value}/confirm`, { method: "POST", body: { actor: "browser-operator", idempotencyKey: form.dataset.idempotencyKey } }); form.closest("dialog").close(); await loadManaged(); toast("Reviewed book added to its box"); } catch (error) { $(".form-status", form).textContent = error.message; } });
$("#reject-candidate").addEventListener("click", async () => { const form = $("#candidate-form"); try { await api(`/api/manage/candidates/${form.candidateId.value}/reject`, { method: "POST", body: {} }); form.closest("dialog").close(); toast("Candidate rejected; no book was created"); } catch (error) { $(".form-status", form).textContent = error.message; } });

function fileBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]); }

load().catch(error => { $("#node-health").textContent = "offline"; toast(error.message); });
