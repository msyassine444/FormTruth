// FormTruth - Popup logic

const API_BASE = "http://127.0.0.1:8000";

const scanBtn = document.getElementById("scanBtn");
const pasteTruthBtn = document.getElementById("pasteTruthBtn");
const closeTruthBtn = document.getElementById("closeTruthBtn");
const saveTruthBtn = document.getElementById("saveTruthBtn");
const truthSection = document.getElementById("truthSection");
const truthInput = document.getElementById("truthInput");
const resultsSection = document.getElementById("resultsSection");
const statusEl = document.getElementById("status");


// ---------- Storage ----------

async function getSavedTruth() {
  const data = await chrome.storage.local.get(["truth"]);
  return data.truth || null;
}

async function saveTruthToStorage(truth) {
  await chrome.storage.local.set({ truth });
}

async function loadTruthIntoTextarea() {
  const truth = await getSavedTruth();
  if (truth) {
    truthInput.value = JSON.stringify(truth, null, 2);
  }
}


// ---------- UI ----------

function setStatus(text, kind = "neutral") {
  statusEl.textContent = text;
  statusEl.classList.remove("error", "success");
  if (kind === "error") statusEl.classList.add("error");
  if (kind === "success") statusEl.classList.add("success");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function showResults(data) {
  resultsSection.classList.remove("hidden");

  const s = data.summary || {};
  document.getElementById("summary").innerHTML = `
    <div class="badge match">
      <span class="num">${s.MATCH || 0}</span>
      <span>Match</span>
    </div>
    <div class="badge conflict">
      <span class="num">${s.CONFLICT || 0}</span>
      <span>Conflict</span>
    </div>
    <div class="badge unknown">
      <span class="num">${s.UNKNOWN || 0}</span>
      <span>Unknown</span>
    </div>
  `;

  const resultsEl = document.getElementById("results");
  resultsEl.innerHTML = "";

  for (const r of data.results || []) {
    const div = document.createElement("div");
    div.className = `result-item ${r.status}`;
    div.innerHTML = `
      <div class="field">${escapeHtml(r.field)}</div>
      <div class="vals">
        <div class="row"><span class="k">Truth:</span><span class="v">${escapeHtml(r.truth ?? "—")}</span></div>
        <div class="row"><span class="k">Form:</span><span class="v">${escapeHtml(r.form ?? "—")}</span></div>
      </div>
    `;
    resultsEl.appendChild(div);
  }
}


// ---------- Scan ----------

scanBtn.addEventListener("click", async () => {
  setStatus("Scanning page…");
  resultsSection.classList.add("hidden");

  const truth = await getSavedTruth();
  if (!truth) {
    setStatus("No truth profile saved. Open 'Edit truth profile' first.", "error");
    truthSection.classList.remove("hidden");
    await loadTruthIntoTextarea();
    return;
  }

  let formFields = {};
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("No active tab");

    // Inject content script (safe if already injected)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch (_) { /* already injected */ }

    const response = await chrome.tabs.sendMessage(tab.id, { action: "getFormFields" });
    formFields = response?.fields || {};
  } catch (e) {
    setStatus(`Cannot read page: ${e.message}`, "error");
    return;
  }

  if (Object.keys(formFields).length === 0) {
    setStatus("No filled form fields found on this page.", "error");
    return;
  }

  setStatus(`Found ${Object.keys(formFields).length} fields. Comparing…`);

  try {
    const res = await fetch(`${API_BASE}/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ truth, form: formFields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    showResults(data);

    const s = data.summary || {};
    if (s.CONFLICT > 0) {
      setStatus(`${s.CONFLICT} conflict(s) found. Review before submitting.`, "error");
    } else {
      setStatus("No conflicts. You can submit safely.", "success");
    }
  } catch (e) {
    setStatus(`Comparison failed: ${e.message}`, "error");
  }
});


// ---------- Truth profile edit ----------

pasteTruthBtn.addEventListener("click", async () => {
  truthSection.classList.toggle("hidden");
  if (!truthSection.classList.contains("hidden")) {
    await loadTruthIntoTextarea();
    truthInput.focus();
  }
});

closeTruthBtn.addEventListener("click", () => {
  truthSection.classList.add("hidden");
});

saveTruthBtn.addEventListener("click", async () => {
  const raw = truthInput.value.trim();
  if (!raw) {
    setStatus("Truth profile is empty.", "error");
    return;
  }

  try {
    const truth = JSON.parse(raw);
    await saveTruthToStorage(truth);
    truthSection.classList.add("hidden");
    setStatus(`Truth profile saved (${Object.keys(truth).length} fields).`, "success");
  } catch (e) {
    setStatus(`Invalid JSON: ${e.message}`, "error");
  }
});


// ---------- Init ----------

(async () => {
  const truth = await getSavedTruth();
  if (truth) {
    setStatus(`Truth profile loaded (${Object.keys(truth).length} fields).`);
  } else {
    setStatus("No truth profile yet. Open 'Edit truth profile' to start.");
  }
})();