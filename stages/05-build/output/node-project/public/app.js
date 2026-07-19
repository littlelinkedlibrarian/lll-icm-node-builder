const state = { boxes: [], books: [], captures: [], captureImages: new Map(), token: localStorage.getItem("lll.operatorToken") ?? "", candidate: null, theme: localStorage.getItem("lll.theme") ?? "garden" };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const empty = () => $("#empty-template").content.cloneNode(true);

function setTheme(theme) {
  const allowed = ["garden", "terminal", "cosmic"];
  state.theme = allowed.includes(theme) ? theme : "garden";
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("lll.theme", state.theme);
  const select = $("#theme-select"); if (select) select.value = state.theme;
}
setTheme(state.theme);

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
  renderBoxes(); renderBooks(state.books); populateBoxes(); state.captures = []; renderAssorted(); updateAccess();
}

async function loadManaged() {
  if (!state.token) return load();
  try {
    const [boxes, books, captures] = await Promise.all([api("/api/manage/boxes?limit=50"), api("/api/manage/books?limit=50"), api("/api/manage/assorted")]);
    state.boxes = boxes.data; state.books = books.data; state.captures = captures.data; $("#box-count").textContent = boxes.pagination.total; $("#book-count").textContent = books.pagination.total; renderBoxes(); renderBooks(state.books); populateBoxes(); await renderAssorted(); updateAccess();
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

async function captureImageUrl(id) {
  if (state.captureImages.has(id)) return state.captureImages.get(id);
  const response = await fetch("/api/manage/assorted/" + id + "/image", { headers: { authorization: "Bearer " + state.token } });
  if (!response.ok) return "";
  const url = URL.createObjectURL(await response.blob()); state.captureImages.set(id, url); return url;
}

async function renderAssorted() {
  const grid = document.querySelector("#assorted-grid"); if (!grid) return;
  grid.replaceChildren(); document.querySelector("#assorted-count").textContent = String(state.captures.length);
  if (!state.token) { const note = document.createElement("div"); note.className = "operator-nudge"; note.textContent = "Connect operator access to review private box captures."; grid.append(note); return; }
  const filter = document.querySelector("#assorted-filter").value;
  const captures = filter ? state.captures.filter(item => item.state === filter) : state.captures;
  if (!captures.length) { grid.append(empty()); return; }
  await Promise.all(captures.map(async capture => {
    const article = document.createElement("article"); article.className = "assorted-card";
    const image = document.createElement("img"); image.alt = "Assorted Things capture: " + capture.fields.title; image.src = await captureImageUrl(capture.id);
    const body = document.createElement("div"); body.className = "assorted-card-body";
    const stateLabel = document.createElement("span"); stateLabel.className = "state-chip state-" + capture.state; stateLabel.textContent = capture.state.replace("_", " ");
    const title = document.createElement("h3"); title.textContent = capture.fields.title;
    const meta = document.createElement("p"); const box = state.boxes.find(item => item.id === capture.boxId); meta.textContent = (box?.name ?? "Unknown box") + " · " + (capture.aiProcessed ? "AI suggested" : "manual review");
    const button = document.createElement("button"); button.type = "button"; button.className = "button button-quiet"; button.dataset.reviewAssorted = capture.id; button.textContent = capture.state === "pending_review" ? "Review unknowns" : "View capture";
    body.append(stateLabel, title, meta, button); article.append(image, body); grid.append(article);
  }));
}

async function openAssortedReview(id) {
  const capture = state.captures.find(item => item.id === id); if (!capture) return;
  const form = document.querySelector("#assorted-review-form"); form.reset(); form.captureId.value = capture.id; form.dataset.idempotencyKey = crypto.randomUUID();
  form.title.value = capture.fields.title; form.category.value = capture.fields.category ?? ""; form.description.value = capture.fields.description ?? ""; form.condition.value = capture.fields.condition ?? ""; form.quantity.value = capture.fields.quantity ?? ""; form.tags.value = capture.fields.tags.join(", ");
  document.querySelector("#assorted-review-image").src = await captureImageUrl(capture.id);
  const fillList = (selector, values, fallback) => { const list = document.querySelector(selector); list.replaceChildren(); (values.length ? values : [fallback]).forEach(value => { const item = document.createElement("li"); item.textContent = value; list.append(item); }); };
  fillList("#assorted-unknowns", capture.fields.unknowns, "No explicit unknowns"); fillList("#assorted-questions", capture.fields.reviewQuestions, "No questions proposed");
  form.querySelectorAll("input,textarea,button").forEach(control => { if (!control.classList.contains("dialog-close")) control.disabled = capture.state !== "pending_review"; });
  openDialog("assorted-dialog");
}

function populateBoxes() {
  const options = `<option value="">Choose a box</option>${state.boxes.map(box => `<option value="${box.id}">${escapeHtml(box.name)}</option>`).join("")}`;
  $("#scan-box").innerHTML = options; $("#assorted-box").innerHTML = options; $("#search-box").innerHTML = `<option value="">Every box</option>${options.replace('<option value="">Choose a box</option>', "")}`;
  $$(".box-options").forEach(select => select.innerHTML = options);
}

function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
function requireOperator(action) { if (state.token) return action(); openDialog("access-dialog"); }

$("#theme-select").addEventListener("change", event => setTheme(event.currentTarget.value));

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
  if (target.dataset.reviewAssorted) await openAssortedReview(target.dataset.reviewAssorted);
  if (target.dataset.editBox) { const box = state.boxes.find(item => item.id === target.dataset.editBox); const form = $("#box-form"); form.reset(); form.dataset.editId = box.id; ["name","description","location","latitude","longitude","visibility"].forEach(key => form[key].value = box[key] ?? ""); openDialog("box-dialog"); }
  if (target.dataset.deleteBox && confirm("Delete this empty box?")) { try { await api(`/api/manage/boxes/${target.dataset.deleteBox}`, { method: "DELETE" }); await loadManaged(); toast("Box deleted"); } catch (error) { toast(error.message); } }
  if (target.dataset.editBook) { const book = state.books.find(item => item.id === target.dataset.editBook); const form = $("#book-form"); form.reset(); form.dataset.editId = book.id; ["boxId","title","author","isbn","genre","description","language","condition"].forEach(key => form[key].value = book[key] ?? ""); openDialog("book-dialog"); }
  if (target.dataset.deleteBook && confirm("Delete this book and its search vector?")) { try { await api(`/api/manage/books/${target.dataset.deleteBook}`, { method: "DELETE" }); await loadManaged(); toast("Book deleted"); } catch (error) { toast(error.message); } }
});

document.querySelector("#assorted-filter").addEventListener("change", renderAssorted);

document.querySelector("#assorted-form").addEventListener("submit", async event => {
  event.preventDefault(); return requireOperator(async () => {
    const file = document.querySelector("#assorted-image").files[0]; const status = document.querySelector("#assorted-status"); if (!file) return;
    status.textContent = "Saving locally first, then asking OpenAI what remains uncertain…";
    try {
      const imageBase64 = await fileBase64(file);
      await api("/api/manage/assorted/analyze", { method: "POST", body: { boxId: document.querySelector("#assorted-box").value, mimeType: file.type, imageBase64, title: document.querySelector("#assorted-title").value, note: document.querySelector("#assorted-note").value } });
      event.currentTarget.reset(); status.textContent = ""; await loadManaged(); toast("Photo saved; metadata is ready for human review");
    } catch (error) { status.textContent = error.message; }
  });
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

function assortedPayload(form) {
  const current = state.captures.find(item => item.id === form.captureId.value);
  return { title: form.title.value.trim(), category: optional(form.category.value), description: optional(form.description.value), tags: form.tags.value.split(",").map(item => item.trim()).filter(Boolean), condition: optional(form.condition.value), quantity: form.quantity.value === "" ? null : Number(form.quantity.value), unknowns: current?.fields.unknowns ?? [], reviewQuestions: current?.fields.reviewQuestions ?? [] };
}

document.querySelector("#assorted-review-form").addEventListener("submit", async event => {
  event.preventDefault(); const form = event.currentTarget;
  try {
    await api("/api/manage/assorted/" + form.captureId.value, { method: "PATCH", body: assortedPayload(form) });
    await api("/api/manage/assorted/" + form.captureId.value + "/confirm", { method: "POST", body: { actor: "browser-operator", idempotencyKey: form.dataset.idempotencyKey } });
    form.closest("dialog").close(); await loadManaged(); toast("Assorted Thing confirmed — no book record created");
  } catch (error) { form.querySelector(".form-status").textContent = error.message; }
});

document.querySelector("#reject-assorted").addEventListener("click", async () => {
  const form = document.querySelector("#assorted-review-form");
  try { await api("/api/manage/assorted/" + form.captureId.value + "/reject", { method: "POST", body: {} }); form.closest("dialog").close(); await loadManaged(); toast("Assorted capture rejected; the history remains intact"); }
  catch (error) { form.querySelector(".form-status").textContent = error.message; }
});

function fileBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]); }

load().catch(error => { $("#node-health").textContent = "offline"; toast(error.message); });
