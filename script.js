const STORAGE_KEY = "attendance_entries_v1";

const form = document.getElementById("attendanceForm");
const tbody = document.getElementById("attendanceTbody");
const stats = document.getElementById("stats");

const clearFormBtn = document.getElementById("clearFormBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const downloadCsvBtn = document.getElementById("downloadCsvBtn");

function nowString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function statusPill(status) {
  if (status === "Obecny") return `<span class="pill ok">Obecny</span>`;
  if (status === "Spóźniony") return `<span class="pill late">Spóźniony</span>`;
  return `<span class="pill no">Nieobecny</span>`;
}

function render() {
  const entries = loadEntries();

  tbody.innerHTML = entries.map((e, idx) => `
    <tr>
      <td>${e.time}</td>
      <td>${escapeHtml(e.firstName)}</td>
      <td>${escapeHtml(e.lastName)}</td>
      <td>${escapeHtml(e.group)}</td>
      <td>${escapeHtml(e.topic)}</td>
      <td>${statusPill(e.status)}</td>
      <td>${escapeHtml(e.note || "")}</td>
      <td>
        <button class="icon-btn" data-remove="${idx}" title="Usuń wpis">Usuń</button>
      </td>
    </tr>
  `).join("");

  const total = entries.length;
  const present = entries.filter(x => x.status === "Obecny").length;
  const late = entries.filter(x => x.status === "Spóźniony").length;
  const absent = entries.filter(x => x.status === "Nieobecny").length;

  stats.textContent = total === 0
    ? "Brak wpisów. Dodaj pierwszy wpis z formularza po lewej."
    : `Wpisy: ${total} | Obecni: ${present} | Spóźnieni: ${late} | Nieobecni: ${absent}`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toCsv(entries) {
  const header = ["time","firstName","lastName","group","topic","status","note"];
  const lines = [header.join(",")];

  for (const e of entries) {
    const row = header.map((k) => csvEscape(e[k] ?? ""));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function csvEscape(value) {
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const data = new FormData(form);
  const entry = {
    time: nowString(),
    firstName: data.get("firstName").trim(),
    lastName: data.get("lastName").trim(),
    group: data.get("group").trim(),
    topic: data.get("topic").trim(),
    status: data.get("status"),
    note: data.get("note").trim()
  };

  const entries = loadEntries();
  entries.unshift(entry); // najnowsze na górze
  saveEntries(entries);

  form.reset();
  document.getElementById("status").value = "Obecny";
  render();
});

tbody.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-remove]");
  if (!btn) return;

  const idx = Number(btn.getAttribute("data-remove"));
  const entries = loadEntries();
  entries.splice(idx, 1);
  saveEntries(entries);
  render();
});

clearFormBtn.addEventListener("click", () => {
  form.reset();
  document.getElementById("status").value = "Obecny";
});

clearAllBtn.addEventListener("click", () => {
  const ok = confirm("Na pewno usunąć wszystkie wpisy? Tego nie da się cofnąć.");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

downloadCsvBtn.addEventListener("click", () => {
  const entries = loadEntries();
  if (entries.length === 0) {
    alert("Brak danych do eksportu.");
    return;
  }
  const csv = toCsv(entries);
  download("lista_obecnosci.csv", csv);
});

render();
