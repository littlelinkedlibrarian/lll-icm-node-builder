const state = { boxes: [], books: [], visibleBooks: [], captures: [], activities: [], captureImages: new Map(), activityImages: new Map(), activityZoom: 1, activeBoxId: null, inventoryThings: [], candidateQueue: [], scanKind: "books", token: localStorage.getItem("lll.operatorToken") ?? "", candidate: null, theme: localStorage.getItem("lll.theme") ?? "garden" };
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
  renderBoxes(); renderBooks(state.books); populateBoxes(); state.captures = []; updateAccess();
}

async function loadManaged() {
  if (!state.token) return load();
  try {
    const [boxes, books, captures, activities] = await Promise.all([api("/api/manage/boxes?limit=50"), api("/api/manage/books?limit=50"), api("/api/manage/assorted"), api("/api/manage/activities?limit=50")]);
    state.boxes = boxes.data; state.books = books.data; state.captures = captures.data; state.activities = activities.data; $("#box-count").textContent = boxes.pagination.total; $("#book-count").textContent = books.pagination.total; renderBoxes(); renderBooks(state.books); populateBoxes(); renderActivities(); updateAccess();
  } catch (error) { state.token = ""; localStorage.removeItem("lll.operatorToken"); updateAccess(); throw error; }
}

function updateAccess() {
  $("#operator-button").textContent = state.token ? "Operator menu" : "Operator access";
  $("#operator-button").classList.toggle("button-primary", Boolean(state.token));
  $("#activity-history").classList.toggle("hidden", !state.token);
  $("#operator-token-label").classList.toggle("hidden", Boolean(state.token));
  $("#operator-connect").classList.toggle("hidden", Boolean(state.token));
  $("#operator-logout").classList.toggle("hidden", !state.token);
  $("#access-status").textContent = state.token ? "Operator access is active on this device. You can scan, review, add, edit, and delete local inventory." : "Guest mode can browse public boxes, book details, search, maps, and confirmed Assorted Things. Connect as an operator to manage this node.";
}

function boxCard(box) {
  const article = document.createElement("article"); article.className = "box-card"; article.dataset.openBox = box.id; article.tabIndex = 0; article.setAttribute("role", "button"); article.setAttribute("aria-label", "Open " + box.name);
  const count = box.bookCount ?? state.books.filter(book => (book.boxId ?? book.libraryBoxId) === box.id).length;
  article.innerHTML = `<div class="box-card-art"></div><div class="box-card-body"><p class="eyebrow">${box.visibility === "private" ? "Private box" : "Public box"}</p><h3>${escapeHtml(box.name)}</h3><p>${escapeHtml(box.description || "A little shelf waiting for its next story.")}</p><div class="box-meta"><span>${escapeHtml(box.location || "Location not published")}</span><strong>${count} book${count === 1 ? "" : "s"}</strong></div>${state.token ? `<div class="book-actions"><button class="icon-button" data-edit-box="${box.id}" aria-label="Edit ${escapeHtml(box.name)}">✎</button><button class="icon-button" data-delete-box="${box.id}" aria-label="Delete ${escapeHtml(box.name)}">×</button></div>` : ""}</div>`;
  return article;
}

function renderBoxes() {
  const grid = $("#box-grid"); grid.replaceChildren();
  if (!state.boxes.length) grid.append(empty()); else state.boxes.forEach(box => grid.append(boxCard(box)));
  const map = $("#map-pins"); map.replaceChildren();
  state.boxes.filter(box => box.latitude !== null && box.longitude !== null).forEach(box => {
    const pin = document.createElement("button"); pin.className = "map-pin"; pin.title = box.name; pin.dataset.openBox = box.id;
    pin.style.left = `${((Number(box.longitude) + 180) / 360) * 94 + 3}%`;
    pin.style.top = `${((90 - Number(box.latitude)) / 180) * 88 + 6}%`; pin.innerHTML = "<span>⌂</span>"; map.append(pin);
  });
  if (!map.children.length) map.append(empty());
}

function renderBooks(books, mode) {
  state.visibleBooks = books; const list = $("#book-list"); list.replaceChildren();
  if (!books.length) list.append(empty());
  books.forEach(book => {
    const boxId = book.boxId ?? book.libraryBoxId; const box = state.boxes.find(item => item.id === boxId);
    const article = document.createElement("article"); article.className = "book-card"; article.dataset.openBook = book.id; article.tabIndex = 0; article.setAttribute("role", "button"); article.setAttribute("aria-label", "View details for " + book.title);
    const visual = book.coverUrl ? `<img class="book-cover" src="${escapeHtml(book.coverUrl)}" alt="Cover of ${escapeHtml(book.title)}" loading="lazy">` : `<div class="book-spine" aria-hidden="true"></div>`;
    article.innerHTML = `${visual}<div><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.author)} · ${escapeHtml(box?.name ?? "Unboxed")}${book.genre ? ` · ${escapeHtml(book.genre)}` : ""}</p></div>${state.token ? `<div class="book-actions"><button class="icon-button" data-edit-book="${book.id}" aria-label="Edit ${escapeHtml(book.title)}">✎</button><button class="icon-button" data-delete-book="${book.id}" aria-label="Delete ${escapeHtml(book.title)}">×</button></div>` : ""}`;
    list.append(article);
  });
  if (mode) $("#search-note").textContent = mode === "semantic" ? "Multilingual semantic results from OpenAI embeddings stored in local sqlite-vec." : mode === "keyword_fallback" ? "OpenAI or vectors were unavailable, so the node returned keyword results." : "Keyword results from the local catalog.";
}

async function activityImageUrl(id) {
  if (state.activityImages.has(id)) return state.activityImages.get(id);
  const response = await fetch("/api/manage/activities/" + id + "/image", { headers: { authorization: "Bearer " + state.token } });
  if (!response.ok) return "";
  const url = URL.createObjectURL(await response.blob()); state.activityImages.set(id, url); return url;
}

async function renderActivities() {
  const grid = $("#activity-grid"); grid.replaceChildren();
  $("#activity-count").textContent = state.activities.length + " scan" + (state.activities.length === 1 ? "" : "s");
  if (!state.activities.length) { grid.append(empty()); return; }
  for (const activity of state.activities) {
    const box = state.boxes.find(item => item.id === activity.boxId), candidates = activity.candidates || [];
    const article = document.createElement("article"); article.className = "activity-card";
    const imageUrl = await activityImageUrl(activity.id);
    article.innerHTML = `<button class="activity-image-button" data-open-activity="${activity.id}" type="button"><img src="${escapeHtml(imageUrl)}" alt="Shelf scan from ${escapeHtml(box?.name || "library box")}" loading="lazy"></button><div class="activity-card-body"><span class="state-chip state-${activity.state}">${activity.state.replaceAll("_", " ")}</span><h3>${escapeHtml(box?.name || "Library scan")}</h3><p>${new Date(activity.createdAt).toLocaleString()} · ${candidates.length} result${candidates.length === 1 ? "" : "s"}</p><button class="button button-quiet" data-open-activity="${activity.id}" type="button">Open activity</button></div>`;
    grid.append(article);
  }
}

function setActivityZoom(next) {
  state.activityZoom = Math.min(4, Math.max(.5, next));
  const image = document.getElementById("activity-image"), viewer = document.getElementById("activity-viewer"), reset = document.querySelector("[data-activity-zoom=reset]");
  image.style.transform = "none"; image.style.maxWidth = state.activityZoom === 1 ? "100%" : "none"; image.style.maxHeight = state.activityZoom === 1 ? "65vh" : "none"; image.style.width = state.activityZoom === 1 ? "auto" : (state.activityZoom * 100) + "%"; image.style.height = "auto";
  reset.textContent = Math.round(state.activityZoom * 100) + "%"; if (state.activityZoom === 1) viewer.scrollTo({ top: 0, left: 0 });
}

async function openActivity(id) {
  const activity = await api("/api/manage/activities/" + id), box = state.boxes.find(item => item.id === activity.boxId);
  $("#activity-title").textContent = box?.name || "Scan activity";
  $("#activity-meta").textContent = new Date(activity.createdAt).toLocaleString() + " · " + (activity.media ? Math.round(activity.media.byteSize / 1024) + " KiB" : "image unavailable");
  $("#activity-state").className = "state-chip state-" + activity.state; $("#activity-state").textContent = activity.state.replaceAll("_", " ");
  $("#activity-image").src = await activityImageUrl(id); setActivityZoom(1);
  const results = $("#activity-results"); results.replaceChildren();
  (activity.candidates || []).forEach((candidate, index) => {
    const proposal = candidate.metadataProposals?.find(item => item.selected) || candidate.metadataProposals?.[0];
    const row = document.createElement("article"); row.className = "activity-result";
    const cover = proposal?.coverUrl ? `<img src="${escapeHtml(proposal.coverUrl)}" alt="Possible cover for ${escapeHtml(candidate.fields.title)}" loading="lazy">` : `<span class="result-number">${index + 1}</span>`;
    row.innerHTML = `${cover}<div><strong>${escapeHtml(candidate.fields.title || "Unreadable title")}</strong><small>${escapeHtml(candidate.fields.author || "Unreadable author")}</small><small>${proposal ? escapeHtml([proposal.isbn13 || proposal.isbn10, proposal.publisher, proposal.publishedDate].filter(Boolean).join(" · ")) : "No edition selected"}</small></div><span class="state-chip state-${candidate.state}">${candidate.state}</span>${candidate.approvedBookId ? `<small>Book ${escapeHtml(candidate.approvedBookId.slice(0, 8))}</small>` : ""}`;
    results.append(row);
  });
  const events = $("#activity-events"); events.replaceChildren();
  (activity.events || []).forEach(item => { const row = document.createElement("li"); row.textContent = new Date(item.createdAt).toLocaleTimeString() + " — " + item.eventType.replaceAll(".", " "); events.append(row); });
  openDialog("activity-dialog");
}

async function captureImageUrl(id) {
  if (state.captureImages.has(id)) return state.captureImages.get(id);
  const response = await fetch("/api/manage/assorted/" + id + "/image", { headers: { authorization: "Bearer " + state.token } });
  if (!response.ok) return "";
  const url = URL.createObjectURL(await response.blob()); state.captureImages.set(id, url); return url;
}

async function openAssortedReview(id) {
  const capture = state.captures.find(item => item.id === id); if (!capture) return;
  const form = document.querySelector("#assorted-review-form"); form.reset(); form.captureId.value = capture.id; form.dataset.idempotencyKey = crypto.randomUUID();
  form.title.value = capture.fields.title; form.category.value = capture.fields.category ?? ""; form.description.value = capture.fields.description ?? ""; form.condition.value = capture.fields.condition ?? ""; form.quantity.value = capture.fields.quantity ?? ""; form.tags.value = capture.fields.tags.join(", ");
  document.querySelector("#assorted-review-image").src = await captureImageUrl(capture.id);
  form.querySelectorAll("input,textarea,button").forEach(control => { if (!control.classList.contains("dialog-close")) control.disabled = capture.state !== "pending_review"; });
  openDialog("assorted-dialog");
}

async function openBoxInventory(id) {
  const box = state.boxes.find(item => item.id === id); if (!box) return;
  state.activeBoxId = id;
  const books = state.books.filter(book => (book.boxId ?? book.libraryBoxId) === id);
  if (state.token) state.inventoryThings = state.captures.filter(item => item.boxId === id && item.state !== "rejected");
  else state.inventoryThings = (await api("/api/boxes/" + id + "/assorted", { manage: false })).data;
  $("#inventory-box-name").textContent = box.name;
  $("#inventory-box-story").textContent = box.description || "A little shelf waiting for its next story.";
  $("#inventory-box-location").textContent = box.location || "Location not published";
  $("#inventory-book-count").textContent = String(books.length);
  $("#inventory-thing-count").textContent = String(state.inventoryThings.length);
  const bookList = $("#inventory-books"); bookList.replaceChildren();
  if (!books.length) bookList.append(empty());
  books.forEach(book => { const article = document.createElement("article"); article.className = "book-card"; article.dataset.openBook = book.id; article.tabIndex = 0; article.setAttribute("role", "button"); article.setAttribute("aria-label", "View details for " + book.title); const visual = book.coverUrl ? "<img class=\"book-cover\" src=\"" + escapeHtml(book.coverUrl) + "\" alt=\"Cover of " + escapeHtml(book.title) + "\" loading=\"lazy\">" : "<div class=\"book-spine\" aria-hidden=\"true\"></div>"; article.innerHTML = visual + "<div><h3>" + escapeHtml(book.title) + "</h3><p>" + escapeHtml(book.author) + (book.genre ? " · " + escapeHtml(book.genre) : "") + "</p></div>"; bookList.append(article); });
  const thingGrid = $("#inventory-things"); thingGrid.replaceChildren();
  if (!state.inventoryThings.length) thingGrid.append(empty());
  for (const item of state.inventoryThings) {
    const article = document.createElement("article"); article.className = "assorted-card";
    const src = item.imageUrl || (item.state === "confirmed" ? "/api/assorted/" + item.id + "/image" : await captureImageUrl(item.id));
    item.displayUrl = src;
    article.innerHTML = "<button class=\"thing-image-button\" data-view-thing=\"" + item.id + "\" type=\"button\"><img src=\"" + escapeHtml(src) + "\" alt=\"" + escapeHtml(item.fields.title) + "\"></button><div class=\"assorted-card-body\"><span class=\"state-chip state-" + item.state + "\">" + item.state.replace("_", " ") + "</span><h3>" + escapeHtml(item.fields.title) + "</h3><p>" + escapeHtml(item.fields.category || "Shared surprise") + "</p>" + (state.token ? "<button class=\"button button-quiet\" data-review-assorted=\"" + item.id + "\" type=\"button\">" + (item.state === "pending_review" ? "Review unknowns" : "View capture") + "</button>" : "<button class=\"button button-quiet\" data-view-thing=\"" + item.id + "\" type=\"button\">Look closer</button>") + "</div>";
    thingGrid.append(article);
  }
  openDialog("box-inventory-dialog");
}

function openThing(id) {
  const item = state.inventoryThings.find(value => value.id === id); if (!item) return;
  const src = item.displayUrl || item.imageUrl || "/api/assorted/" + item.id + "/image";
  $("#thing-image").src = src; $("#thing-image").alt = item.fields.title;
  $("#thing-category").textContent = item.fields.category || "Assorted thing";
  $("#thing-title").textContent = item.fields.title;
  $("#thing-description").textContent = item.fields.description || "A neighbor-shared item in this box.";
  $("#thing-meta").textContent = [item.fields.condition, item.fields.quantity ? "Quantity " + item.fields.quantity : null, ...(item.fields.tags || [])].filter(Boolean).join(" · ");
  openDialog("thing-dialog");
}

function openBookDetails(id) {
  const book = state.visibleBooks.find(item => item.id === id) || state.books.find(item => item.id === id); if (!book) return;
  const boxId = book.boxId ?? book.libraryBoxId; const box = state.boxes.find(item => item.id === boxId);
  const inventoryDialog = document.getElementById("box-inventory-dialog"); if (inventoryDialog.open) inventoryDialog.close();
  const cover = document.getElementById("book-details-cover"); cover.replaceChildren();
  if (book.coverUrl) { const image = document.createElement("img"); image.src = book.coverUrl; image.alt = "Cover of " + book.title; cover.append(image); }
  else { const spine = document.createElement("div"); spine.className = "book-details-placeholder"; spine.textContent = "No cover available"; cover.append(spine); }
  document.getElementById("book-details-box").textContent = box?.name || "Unboxed book";
  document.getElementById("book-details-title").textContent = book.title;
  document.getElementById("book-details-author").textContent = "by " + book.author;
  document.getElementById("book-details-description").textContent = book.description || "No description has been added yet.";
  const metadata = document.getElementById("book-details-metadata"); metadata.replaceChildren();
  [["ISBN", book.isbn], ["Genre", book.genre], ["Language", book.language], ["Publication year", book.publicationYear], ["Condition", book.condition], ["Cataloged", book.aiExtracted || book.aiProvenance ? "AI-assisted, human confirmed" : "Manual entry"], ["Added", book.createdAt ? new Date(book.createdAt).toLocaleDateString() : null]].filter(([, value]) => value !== null && value !== undefined && value !== "").forEach(([label, value]) => { const term = document.createElement("dt"); term.textContent = String(label); const detail = document.createElement("dd"); detail.textContent = String(value).replaceAll("_", " "); metadata.append(term, detail); });
  const source = document.getElementById("book-details-source"), sourceUrl = book.metadataProvenance?.sourceUrl; source.classList.toggle("hidden", !sourceUrl); if (sourceUrl) source.href = sourceUrl;
  openDialog("book-details-dialog");
}

function populateBoxes() {
  const options = `<option value="">Choose a box</option>${state.boxes.map(box => `<option value="${box.id}">${escapeHtml(box.name)}</option>`).join("")}`;
  $("#scan-box").innerHTML = options; $("#search-box").innerHTML = `<option value="">Every box</option>${options.replace('<option value="">Choose a box</option>', "")}`;
  $$(".box-options").forEach(select => select.innerHTML = options);
}

function openDialog(id) { const dialog = document.getElementById(id); if (dialog && !dialog.open) dialog.showModal(); }
function requireOperator(action) { if (state.token) return action(); openDialog("access-dialog"); }

document.getElementById("theme-select").addEventListener("change", event => setTheme(event.currentTarget.value));

document.getElementById("operator-button").addEventListener("click", () => { document.getElementById("operator-token").value = ""; updateAccess(); openDialog("access-dialog"); });
document.getElementById("access-form").addEventListener("submit", async event => { event.preventDefault(); const token = document.getElementById("operator-token").value.trim(); if (!token) { toast("Enter the operator token"); return; } state.token = token; localStorage.setItem("lll.operatorToken", state.token); try { await loadManaged(); document.getElementById("access-dialog").close(); toast("Operator access connected"); } catch (error) { toast(error.message); } });
document.getElementById("operator-logout").addEventListener("click", async () => { state.token = ""; localStorage.removeItem("lll.operatorToken"); document.getElementById("operator-token").value = ""; document.getElementById("access-dialog").close(); await load(); toast("Logged out — public browsing remains available"); });

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
  const target = event.target.closest("button,[data-open-box],[data-open-book]"); if (!target) return;
  if (target.dataset.openBox) await openBoxInventory(target.dataset.openBox);
  if (target.dataset.openBook) openBookDetails(target.dataset.openBook);
  if (target.dataset.openActivity) await openActivity(target.dataset.openActivity);
  if (target.dataset.activityZoom) setActivityZoom(target.dataset.activityZoom === "in" ? state.activityZoom + .25 : target.dataset.activityZoom === "out" ? state.activityZoom - .25 : 1);
  if (target.dataset.viewThing) openThing(target.dataset.viewThing);
  if (target.dataset.reviewAssorted) { $("#box-inventory-dialog").close(); await openAssortedReview(target.dataset.reviewAssorted); }
  if (target.dataset.editCandidate) openCandidateEdit(target.dataset.editCandidate);
  if (target.dataset.editBox) { const box = state.boxes.find(item => item.id === target.dataset.editBox); const form = $("#box-form"); form.reset(); form.dataset.editId = box.id; ["name","description","location","latitude","longitude","visibility"].forEach(key => form[key].value = box[key] ?? ""); openDialog("box-dialog"); }
  if (target.dataset.deleteBox && confirm("Delete this empty box?")) { try { await api(`/api/manage/boxes/${target.dataset.deleteBox}`, { method: "DELETE" }); await loadManaged(); toast("Box deleted"); } catch (error) { toast(error.message); } }
  if (target.dataset.editBook) { const book = state.books.find(item => item.id === target.dataset.editBook); const form = $("#book-form"); form.reset(); form.dataset.editId = book.id; ["boxId","title","author","isbn","genre","description","language","condition"].forEach(key => form[key].value = book[key] ?? ""); openDialog("book-dialog"); }
  if (target.dataset.deleteBook && confirm("Delete this book and its search vector?")) { try { await api(`/api/manage/books/${target.dataset.deleteBook}`, { method: "DELETE" }); await loadManaged(); toast("Book deleted"); } catch (error) { toast(error.message); } }
});

document.addEventListener("keydown", async event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest("[data-open-box],[data-open-book]"); if (!target || event.target.closest("button")) return;
  event.preventDefault(); if (target.dataset.openBox) await openBoxInventory(target.dataset.openBox); else if (target.dataset.openBook) openBookDetails(target.dataset.openBook);
});

function clearFileSelection(prefix) {
  const panel = document.getElementById(prefix + "-selection"), image = document.getElementById(prefix + "-selection-image");
  if (panel.dataset.objectUrl) URL.revokeObjectURL(panel.dataset.objectUrl); panel.dataset.objectUrl = ""; image.removeAttribute("src"); panel.classList.add("hidden");
}
function showFileSelection(file, prefix) {
  clearFileSelection(prefix); if (!file) return;
  const panel = document.getElementById(prefix + "-selection"), url = URL.createObjectURL(file); panel.dataset.objectUrl = url;
  document.getElementById(prefix + "-selection-image").src = url; document.getElementById(prefix + "-selection-name").textContent = "1 image selected — " + file.name;
  document.getElementById(prefix + "-selection-meta").textContent = (file.type || "image") + " · " + Math.max(1, Math.round(file.size / 1024)) + " KiB"; panel.classList.remove("hidden");
}
function bindFileSelection(firstId, secondId, prefix) {
  [firstId, secondId].forEach((id, index, ids) => document.getElementById(id).addEventListener("change", event => { const other = document.getElementById(ids[index === 0 ? 1 : 0]); if (event.currentTarget.files[0]) other.value = ""; showFileSelection(event.currentTarget.files[0], prefix); }));
}
bindFileSelection("scan-camera", "scan-image", "scan"); bindFileSelection("assorted-camera", "assorted-image", "assorted");

document.querySelector("#assorted-form").addEventListener("submit", async event => {
  event.preventDefault(); return requireOperator(async () => {
    const file = document.querySelector("#assorted-camera").files[0] || document.querySelector("#assorted-image").files[0]; const status = document.querySelector("#assorted-status"); if (!document.querySelector("#scan-box").value) { status.textContent = "Choose a destination box first."; return; } if (!file) return;
    status.textContent = "Saving the photo for human review…";
    try {
      const imageBase64 = await fileBase64(file);
      const capture = await api("/api/manage/assorted/capture", { method: "POST", body: { boxId: document.querySelector("#scan-box").value, mimeType: file.type, imageBase64, title: document.querySelector("#assorted-title").value, note: document.querySelector("#assorted-note").value } });
      status.textContent = "Saved — opening human review…"; event.currentTarget.reset(); clearFileSelection("assorted"); await loadManaged(); status.textContent = ""; await openAssortedReview(capture.id); toast("Photo saved — describe the item, then publish or reject it");
    } catch (error) { status.textContent = error.message; }
  });
});

$$(`[data-scan-kind]`).forEach(button => button.addEventListener("click", () => {
  state.scanKind = button.dataset.scanKind;
  $$(`[data-scan-kind]`).forEach(item => item.classList.toggle("active", item === button));
  $("#scan-form").classList.toggle("hidden", state.scanKind !== "books");
  $("#assorted-form").classList.toggle("hidden", state.scanKind !== "assorted");
}));

$("#scan-this-box").addEventListener("click", () => requireOperator(() => {
  $("#box-inventory-dialog").close(); $("#scan-box").value = state.activeBoxId || ""; location.hash = "scanner";
}));

$("#seed-button").addEventListener("click", () => requireOperator(async () => { try { await api("/api/manage/demo/seed", { method: "POST", body: {} }); await loadManaged(); toast("Demo library ready"); } catch (error) { toast(error.message); } }));
$$('[data-view]').forEach(button => button.addEventListener("click", () => { $$('[data-view]').forEach(item => item.classList.toggle("active", item === button)); $("#box-grid").classList.toggle("hidden", button.dataset.view !== "cards"); $("#box-map").classList.toggle("hidden", button.dataset.view !== "map"); }));

$("#search-form").addEventListener("submit", async event => { event.preventDefault(); const query = new URLSearchParams({ q: $("#search-query").value }); if ($("#search-box").value) query.set("boxId", $("#search-box").value); try { const result = await api(`/api/search?${query}`, { manage: false }); renderBooks(result.data, result.mode); } catch (error) { toast(error.message); } });

$("#scan-form").addEventListener("submit", async event => {
  event.preventDefault(); return requireOperator(async () => { const file = $("#scan-camera").files[0] || $("#scan-image").files[0]; const status = $("#scan-status"); if (!$("#scan-box").value) { status.textContent = "Choose a destination box first."; return; } if (!file) return; status.textContent = "GPT-5.6 is looking across the whole image for books…";
    try {
      const imageBase64 = await fileBase64(file);
      const batch = await api("/api/manage/candidates/analyze", { method: "POST", body: { boxId: $("#scan-box").value, mimeType: file.type, imageBase64 } });
      state.candidateQueue = [...batch.candidates]; state.activities = [batch, ...state.activities.filter(item => item.id !== batch.id)]; renderActivities(); status.textContent = batch.candidates.length + " book candidate" + (batch.candidates.length === 1 ? "" : "s") + " found — review them together before publishing.";
      renderCandidateBatch(); openDialog("candidate-batch-dialog");
    } catch (error) { status.textContent = error.message; await loadManaged().catch(() => {}); }
  });
});

function completeCandidate(candidate) { return Boolean(candidate.fields.title?.trim() && candidate.fields.author?.trim()); }

function renderCandidateBatch() {
  const list = $("#candidate-batch-list"); list.replaceChildren();
  state.candidateQueue.forEach(candidate => {
    const complete = completeCandidate(candidate); if (candidate._selected === undefined) candidate._selected = complete;
    const proposals = candidate.metadataProposals || [], chosen = proposals.find(item => item.selected);
    if (candidate._metadataProposalId === undefined) candidate._metadataProposalId = chosen?.id || null;
    const preview = proposals.find(item => item.id === candidate._metadataProposalId) || proposals[0];
    const options = `<option value="">Keep reviewed fields; no edition</option>` + proposals.map(item => `<option value="${item.id}"${item.id === candidate._metadataProposalId ? " selected" : ""}>${escapeHtml([item.title, item.publisher, item.publishedDate, item.isbn13 || item.isbn10].filter(Boolean).join(" · "))}</option>`).join("");
    const row = document.createElement("article"); row.className = "candidate-batch-row" + (complete ? "" : " needs-review");
    const cover = preview?.coverUrl ? `<img class="candidate-cover" src="${escapeHtml(preview.coverUrl)}" alt="Possible edition cover" loading="lazy">` : `<span class="candidate-placeholder">▤</span>`;
    row.innerHTML = `${cover}<label class="candidate-select"><input type="checkbox" data-batch-candidate="${candidate.id}"${candidate._selected ? " checked" : ""}><span><strong>${escapeHtml(candidate.fields.title || "Title needed")}</strong><small>${escapeHtml(candidate.fields.author || "Author needed")}${candidate.fields.genre ? " · " + escapeHtml(candidate.fields.genre) : ""}</small><small>${candidate.fields.isbn ? "Visible ISBN " + escapeHtml(candidate.fields.isbn) : "ISBN will only come from a selected edition"}</small></span></label><label class="metadata-choice">Edition metadata<select data-metadata-candidate="${candidate.id}">${options}</select></label><span class="candidate-state">${complete ? "Ready" : "Needs edit"}</span><button class="button button-quiet" data-edit-candidate="${candidate.id}" type="button">Edit</button>`;
    list.append(row);
  });
  list.querySelectorAll("[data-batch-candidate]").forEach(input => input.addEventListener("change", () => { const candidate = state.candidateQueue.find(item => item.id === input.dataset.batchCandidate); if (candidate) candidate._selected = input.checked; }));
  list.querySelectorAll("[data-metadata-candidate]").forEach(select => select.addEventListener("change", () => { const candidate = state.candidateQueue.find(item => item.id === select.dataset.metadataCandidate); if (candidate) { candidate._metadataProposalId = select.value || null; renderCandidateBatch(); } }));
}

function openCandidateEdit(id) {
  const candidate = state.candidateQueue.find(item => item.id === id); if (!candidate) return;
  state.candidate = candidate; $("#candidate-batch-dialog").close(); fillCandidate(candidate);
  const position = state.candidateQueue.findIndex(item => item.id === id) + 1;
  $("#candidate-progress").textContent = "Candidate " + position + " of " + state.candidateQueue.length; openDialog("candidate-dialog");
}

function fillCandidate(candidate) { const form = $("#candidate-form"); form.reset(); form.candidateId.value = candidate.id; form.boxId.value = candidate.boxId; Object.entries(candidate.fields).forEach(([key,value]) => { if (form[key]) form[key].value = value ?? ""; }); }
function candidatePayload(form) { return { title: form.title.value.trim(), author: form.author.value.trim(), isbn: optional(form.isbn.value), genre: optional(form.genre.value), description: optional(form.description.value), language: optional(form.language.value), condition: optional(form.condition.value) }; }

$("#candidate-form").addEventListener("submit", async event => { event.preventDefault(); const form = event.currentTarget; try { const prior = state.candidateQueue.find(item => item.id === form.candidateId.value); const updated = await api("/api/manage/candidates/" + form.candidateId.value, { method: "PATCH", body: candidatePayload(form) }); updated._selected = true; updated._metadataProposalId = prior?._metadataProposalId ?? null; const index = state.candidateQueue.findIndex(item => item.id === updated.id); if (index >= 0) state.candidateQueue[index] = updated; form.closest("dialog").close(); renderCandidateBatch(); openDialog("candidate-batch-dialog"); toast("Candidate updated"); } catch (error) { $(".form-status", form).textContent = error.message; } });

$("#candidate-batch-form").addEventListener("submit", async event => {
  event.preventDefault(); const form = event.currentTarget; const selected = state.candidateQueue.filter(candidate => candidate._selected);
  if (!selected.length) { $(".form-status", form).textContent = "Select at least one book, or reject the batch."; return; }
  if (selected.some(candidate => !completeCandidate(candidate))) { $(".form-status", form).textContent = "Edit selected candidates that still need a title or author."; return; }
  try {
    for (const candidate of state.candidateQueue) {
      if (candidate._selected) {
        if (candidate.metadataProposals?.length) await api("/api/manage/candidates/" + candidate.id + "/metadata-selection", { method: "POST", body: { proposalId: candidate._metadataProposalId ?? null } });
        await api("/api/manage/candidates/" + candidate.id + "/confirm", { method: "POST", body: { actor: "browser-operator", idempotencyKey: crypto.randomUUID() } });
      }
      else await api("/api/manage/candidates/" + candidate.id + "/reject", { method: "POST", body: {} });
    }
    state.candidateQueue = []; document.getElementById("scan-form").reset(); clearFileSelection("scan"); form.closest("dialog").close(); await loadManaged(); toast(selected.length + " reviewed book" + (selected.length === 1 ? "" : "s") + " added");
  } catch (error) { $(".form-status", form).textContent = error.message; }
});

async function rejectCandidateBatch() {
  for (const candidate of state.candidateQueue) { try { await api("/api/manage/candidates/" + candidate.id + "/reject", { method: "POST", body: {} }); } catch {} }
  state.candidateQueue = []; document.getElementById("scan-form").reset(); clearFileSelection("scan"); document.getElementById("candidate-batch-dialog").close(); toast("Book candidates rejected");
}

$("#reject-batch").addEventListener("click", rejectCandidateBatch);
$("#candidate-batch-close").addEventListener("click", rejectCandidateBatch);
$("#candidate-edit-close").addEventListener("click", () => { renderCandidateBatch(); openDialog("candidate-batch-dialog"); });
$("#reject-candidate").addEventListener("click", async () => { const form = $("#candidate-form"); try { await api("/api/manage/candidates/" + form.candidateId.value + "/reject", { method: "POST", body: {} }); state.candidateQueue = state.candidateQueue.filter(item => item.id !== form.candidateId.value); form.closest("dialog").close(); renderCandidateBatch(); if (state.candidateQueue.length) openDialog("candidate-batch-dialog"); else toast("No candidates remain"); } catch (error) { $(".form-status", form).textContent = error.message; } });

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

$("#activity-viewer").addEventListener("wheel", event => { event.preventDefault(); setActivityZoom(state.activityZoom + (event.deltaY < 0 ? .2 : -.2)); }, { passive: false });

function fileBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]); }

load().catch(error => { $("#node-health").textContent = "offline"; toast(error.message); });
