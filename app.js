// Default Initial State
const DEFAULT_STATE = {
  meta: {
    partner1: "Fajar Sidiq",
    partner2: "Selviana Nurhidayah",
    weddingDate: "2027-12-12",
    pin: "2027"
  },
  categories: [
    { id: "cat_mahar", name: "Mahar & Seserahan", target: 20000000 },
    { id: "cat_venue", name: "Venue & Katering", target: 65000000 },
    { id: "cat_attire", name: "Busana, MUA & Dekorasi", target: 35000000 },
    { id: "cat_doc", name: "Dokumentasi & Souvenir", target: 15000000 },
    { id: "cat_emergency", name: "Dana Cadangan & KUA", target: 15000000 }
  ],
  transactions: [
    {
      id: "tx_init_1",
      type: "deposit",
      partner: "Fajar",
      amount: 15000000,
      categoryId: "cat_venue",
      date: "2026-10-01",
      method: "Blu by BCA Digital",
      note: "Saldo awal tabungan bersama"
    },
    {
      id: "tx_init_2",
      type: "deposit",
      partner: "Selviana",
      amount: 12500000,
      categoryId: "cat_mahar",
      date: "2026-10-05",
      method: "Bibit Reksadana Pasar Uang",
      note: "Setoran awal pos mahar & seserahan"
    }
  ]
};

// Runtime Session & Firebase Variables
let appState = structuredClone(DEFAULT_STATE);
let sessionConfig = {
  activeUser: "Fajar",
  roomId: "fajar-selviana-2027",
  firebaseUrl: "",
  firebaseApiKey: ""
};
let dbRef = null;
let isCloudConnected = false;
let chartMode = "partner";
let chartInstance = null;

// DOM Elements
const authGate = document.getElementById("authGate");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("loginForm");
const syncIndicator = document.getElementById("syncIndicator");
const activeUserLabel = document.getElementById("activeUserLabel");

// Formatters
const formatIDR = (num) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(num) || 0);
};

const formatDateID = (isoDate) => {
  if (!isoDate) return "-";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

// Load saved session preferences from localStorage
function loadSavedSession() {
  const saved = localStorage.getItem("wedding_session_cfg");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      sessionConfig = { ...sessionConfig, ...parsed };
      document.getElementById("loginPartner").value = sessionConfig.activeUser || "Fajar";
      document.getElementById("roomCodeInput").value = sessionConfig.roomId || "fajar-selviana-2027";
      document.getElementById("firebaseUrlInput").value = sessionConfig.firebaseUrl || "";
      document.getElementById("firebaseApiKeyInput").value = sessionConfig.firebaseApiKey || "";
    } catch (e) {
      console.warn("Gagal memuat konfigurasi sesi:", e);
    }
  }
}

function saveSessionConfig() {
  localStorage.setItem("wedding_session_cfg", JSON.stringify(sessionConfig));
}

function getLocalStorageKey() {
  return `wedding_room_data_${sessionConfig.roomId}`;
}

function loadLocalData() {
  const raw = localStorage.getItem(getLocalStorageKey());
  if (raw) {
    try {
      appState = JSON.parse(raw);
    } catch (e) {
      appState = structuredClone(DEFAULT_STATE);
    }
  } else {
    appState = structuredClone(DEFAULT_STATE);
    saveLocalData();
  }
}

function saveLocalData() {
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(appState));
}

// Initialize Firebase Realtime Database if URL is provided
function initRealtimeSync() {
  const url = (sessionConfig.firebaseUrl || "").trim().replace(/\/$/, "");
  if (!url) {
    isCloudConnected = false;
    updateSyncUI(false, "Mode Lokal (Offline)");
    loadLocalData();
    renderAll();
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: sessionConfig.firebaseApiKey || "demo-key",
        databaseURL: url
      });
    } else {
      // Re-use or re-init if URL changed
      const existingUrl = firebase.app().options.databaseURL;
      if (existingUrl !== url) {
        firebase.app().delete().then(() => {
          firebase.initializeApp({
            apiKey: sessionConfig.firebaseApiKey || "demo-key",
            databaseURL: url
          });
          attachFirebaseListeners();
        });
        return;
      }
    }
    attachFirebaseListeners();
  } catch (err) {
    console.error("Firebase init error:", err);
    isCloudConnected = false;
    updateSyncUI(false, "Gagal Konek Cloud (Fallback Lokal)");
    loadLocalData();
    renderAll();
  }
}

function attachFirebaseListeners() {
  const roomPath = `wedding_rooms/${sessionConfig.roomId}`;
  dbRef = firebase.database().ref(roomPath);

  // Monitor connection state
  firebase.database().ref(".info/connected").on("value", (snap) => {
    if (snap.val() === true) {
      isCloudConnected = true;
      updateSyncUI(true, `Live Sync • Room: ${sessionConfig.roomId}`);
    } else {
      isCloudConnected = false;
      updateSyncUI(false, "Menghubungkan ke Cloud...");
    }
  });

  // Listen for realtime updates from partner
  dbRef.on("value", (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      // Seed initial room state on first connect
      loadLocalData();
      dbRef.set(appState);
    } else {
      appState = {
        meta: { ...DEFAULT_STATE.meta, ...(val.meta || {}) },
        categories: Array.isArray(val.categories) ? val.categories : Object.values(val.categories || DEFAULT_STATE.categories),
        transactions: val.transactions
          ? (Array.isArray(val.transactions) ? val.transactions : Object.values(val.transactions))
          : []
      };
      saveLocalData();
      renderAll();
    }
  }, (error) => {
    console.error("Firebase read error:", error);
    updateSyncUI(false, "Akses Database Ditolak (Cek Rules)");
    loadLocalData();
    renderAll();
  });
}

function persistState() {
  saveLocalData();
  if (dbRef && isCloudConnected) {
    dbRef.set(appState).catch((err) => {
      console.error("Gagal sinkron ke Firebase:", err);
    });
  }
  renderAll();
}

function updateSyncUI(online, labelText) {
  syncIndicator.textContent = `● ${labelText}`;
  syncIndicator.className = `sync-badge ${online ? "online" : "offline"}`;
}

// Login Handler
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const partner = document.getElementById("loginPartner").value;
  const roomId = document.getElementById("roomCodeInput").value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  const pin = document.getElementById("roomPinInput").value.trim();
  const fbUrl = document.getElementById("firebaseUrlInput").value.trim();
  const fbKey = document.getElementById("firebaseApiKeyInput").value.trim();

  if (!roomId) {
    alert("Kode ruang bersama tidak boleh kosong.");
    return;
  }

  sessionConfig.activeUser = partner;
  sessionConfig.roomId = roomId;
  sessionConfig.firebaseUrl = fbUrl;
  sessionConfig.firebaseApiKey = fbKey;
  saveSessionConfig();

  loadLocalData();
  if (appState.meta && appState.meta.pin && pin !== appState.meta.pin) {
    alert("PIN keamanan salah! Gunakan PIN bersama Anda (default awal: 2027).");
    return;
  }

  activeUserLabel.textContent = `Aktif: ${partner}`;
  document.getElementById("txPartner").value = partner;
  document.getElementById("txDate").valueAsDate = new Date();

  authGate.classList.add("hidden");
  appShell.classList.remove("hidden");
  initRealtimeSync();
});

document.getElementById("btnSwitchUser").addEventListener("click", () => {
  appShell.classList.add("hidden");
  authGate.classList.remove("hidden");
});

// Core Calculations
function computeSummary() {
  const totalTarget = appState.categories.reduce((acc, c) => acc + (Number(c.target) || 0), 0);
  let fajarNet = 0;
  let selvianaNet = 0;
  let bersamaNet = 0;
  const categoryTotals = {};

  appState.categories.forEach((c) => {
    categoryTotals[c.id] = 0;
  });

  appState.transactions.forEach((tx) => {
    const val = Number(tx.amount) || 0;
    const signed = tx.type === "expense" ? -val : val;

    if (tx.partner === "Fajar") fajarNet += signed;
    else if (tx.partner === "Selviana") selvianaNet += signed;
    else bersamaNet += signed;

    if (tx.type === "deposit") {
      categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + val;
    }
  });

  const totalCollected = Math.max(0, fajarNet + selvianaNet + bersamaNet);
  const remaining = Math.max(0, totalTarget - totalCollected);
  const percent = totalTarget > 0 ? Math.min(100, (totalCollected / totalTarget) * 100) : 0;

  return {
    totalTarget,
    totalCollected,
    remaining,
    percent,
    fajarNet: Math.max(0, fajarNet),
    selvianaNet: Math.max(0, selvianaNet),
    bersamaNet: Math.max(0, bersamaNet),
    categoryTotals
  };
}

// Render Functions
function renderAll() {
  const stats = computeSummary();

  // Names & Countdown
  document.getElementById("partner1NameDisplay").textContent = appState.meta.partner1;
  document.getElementById("partner2NameDisplay").textContent = appState.meta.partner2;
  document.getElementById("weddingDateDisplay").textContent = formatDateID(appState.meta.weddingDate);

  const today = new Date();
  const targetDate = new Date(appState.meta.weddingDate + "T00:00:00");
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const monthsLeft = Math.max(1, Math.ceil(diffDays / 30));

  document.getElementById("countdownDisplay").textContent =
    diffDays > 0 ? `${diffDays} Hari Lagi` : "Hari H Tiba! 🎉";

  // Totals & Progress
  document.getElementById("totalCollectedDisplay").textContent = formatIDR(stats.totalCollected);
  document.getElementById("targetTotalDisplay").textContent = formatIDR(stats.totalTarget);
  document.getElementById("overallPercentDisplay").textContent = `${stats.percent.toFixed(1)}%`;
  document.getElementById("overallProgressBar").style.width = `${stats.percent}%`;
  document.getElementById("remainingAmountDisplay").textContent = formatIDR(stats.remaining);
  document.getElementById("monthlyRecommendationDisplay").textContent =
    `${formatIDR(Math.ceil(stats.remaining / monthsLeft))} / bln`;

  // Partner Split
  const partnerSum = stats.fajarNet + stats.selvianaNet;
  const fajarShare = partnerSum > 0 ? ((stats.fajarNet / partnerSum) * 100).toFixed(1) : 0;
  const selvianaShare = partnerSum > 0 ? ((stats.selvianaNet / partnerSum) * 100).toFixed(1) : 0;

  document.getElementById("partner1AmountDisplay").textContent = formatIDR(stats.fajarNet);
  document.getElementById("partner1ShareDisplay").textContent = `Kontribusi ${fajarShare}%`;
  document.getElementById("partner1Bar").style.width = `${fajarShare}%`;

  document.getElementById("partner2AmountDisplay").textContent = formatIDR(stats.selvianaNet);
  document.getElementById("partner2ShareDisplay").textContent = `Kontribusi ${selvianaShare}%`;
  document.getElementById("partner2Bar").style.width = `${selvianaShare}%`;

  renderCategorySelect();
  renderBudgetGrid(stats.categoryTotals);
  renderLedger();
  renderChart(stats);
}

function renderCategorySelect() {
  const select = document.getElementById("txCategory");
  const currentVal = select.value;
  select.innerHTML = appState.categories
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
  if (currentVal && appState.categories.some((c) => c.id === currentVal)) {
    select.value = currentVal;
  }
}

function renderBudgetGrid(categoryTotals) {
  const grid = document.getElementById("budgetGrid");
  grid.innerHTML = appState.categories
    .map((cat) => {
      const saved = categoryTotals[cat.id] || 0;
      const target = Number(cat.target) || 0;
      const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
      return `
        <div class="budget-item">
          <div class="budget-item-top">
            <span class="budget-item-title">${cat.name}</span>
            <button type="button" class="budget-edit-btn" onclick="editCategoryTarget('${cat.id}')">Edit Target</button>
          </div>
          <div class="mini-progress">
            <div class="mini-bar fajar-bar" style="width: ${pct}%"></div>
          </div>
          <div class="budget-amounts">
            <span>Terkumpul: <strong>${formatIDR(saved)}</strong></span>
            <span>${pct.toFixed(0)}% dari ${formatIDR(target)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

window.editCategoryTarget = function (catId) {
  const cat = appState.categories.find((c) => c.id === catId);
  if (!cat) return;
  const newName = prompt("Nama Pos Anggaran:", cat.name);
  if (newName === null) return;
  const newTargetRaw = prompt(`Target Nominal untuk "${newName}" (Rp):`, cat.target);
  if (newTargetRaw === null) return;

  const parsedTarget = Number(newTargetRaw.replace(/[^0-9]/g, ""));
  if (isNaN(parsedTarget) || parsedTarget < 0) {
    alert("Nominal tidak valid.");
    return;
  }

  cat.name = newName.trim() || cat.name;
  cat.target = parsedTarget;
  persistState();
};

document.getElementById("btnAddCategory").addEventListener("click", () => {
  const name = prompt("Nama pos anggaran baru (contoh: Bulan Madu / Cincin Kawin):");
  if (!name || !name.trim()) return;
  const targetRaw = prompt(`Target dana untuk ${name.trim()} (Rp):`, "10000000");
  if (!targetRaw) return;
  const target = Number(targetRaw.replace(/[^0-9]/g, "")) || 0;

  appState.categories.push({
    id: "cat_" + Date.now(),
    name: name.trim(),
    target
  });
  persistState();
});

// Ledger Rendering & CRUD
function renderLedger() {
  const tbody = document.getElementById("ledgerBody");
  const filter = document.getElementById("filterPartner").value;
  const catMap = Object.fromEntries(appState.categories.map((c) => [c.id, c.name]));

  const sorted = [...appState.transactions]
    .filter((tx) => filter === "ALL" || tx.partner === filter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--text-muted);padding:24px;">Belum ada transaksi tercatat.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map((tx) => {
      const isExpense = tx.type === "expense";
      return `
        <tr>
          <td>${formatDateID(tx.date)}</td>
          <td><span class="badge-partner badge-${tx.partner}">${tx.partner}</span></td>
          <td>${catMap[tx.categoryId] || "Umum"}</td>
          <td>
            <div>${tx.note || "-"}</div>
            <small style="color:var(--text-muted)">${tx.method || ""}</small>
          </td>
          <td class="text-right ${isExpense ? "amount-expense" : "amount-deposit"}">
            ${isExpense ? "-" : "+"} ${formatIDR(tx.amount)}
          </td>
          <td class="text-center">
            <div class="action-btns">
              <button type="button" class="icon-action" title="Edit" onclick="startEditTx('${tx.id}')">✏️</button>
              <button type="button" class="icon-action" title="Hapus" onclick="deleteTx('${tx.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

document.getElementById("filterPartner").addEventListener("change", renderLedger);

document.getElementById("transactionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const editId = document.getElementById("editTxId").value;
  const payload = {
    id: editId || "tx_" + Date.now(),
    type: document.getElementById("txType").value,
    partner: document.getElementById("txPartner").value,
    amount: Number(document.getElementById("txAmount").value),
    categoryId: document.getElementById("txCategory").value,
    date: document.getElementById("txDate").value,
    method: document.getElementById("txMethod").value.trim(),
    note: document.getElementById("txNote").value.trim()
  };

  if (editId) {
    const idx = appState.transactions.findIndex((t) => t.id === editId);
    if (idx !== -1) appState.transactions[idx] = payload;
  } else {
    appState.transactions.push(payload);
  }

  resetTxForm();
  persistState();
});

window.startEditTx = function (txId) {
  const tx = appState.transactions.find((t) => t.id === txId);
  if (!tx) return;
  document.getElementById("editTxId").value = tx.id;
  document.getElementById("txType").value = tx.type;
  document.getElementById("txPartner").value = tx.partner;
  document.getElementById("txAmount").value = tx.amount;
  document.getElementById("txCategory").value = tx.categoryId;
  document.getElementById("txDate").value = tx.date;
  document.getElementById("txMethod").value = tx.method || "";
  document.getElementById("txNote").value = tx.note || "";

  document.getElementById("txFormTitle").textContent = "✏️ Edit Transaksi Realtime";
  document.getElementById("btnSubmitTx").textContent = "Perbarui Transaksi";
  document.getElementById("btnCancelEditTx").classList.remove("hidden");
  document.getElementById("transactionForm").scrollIntoView({ behavior: "smooth" });
};

window.deleteTx = function (txId) {
  if (!confirm("Hapus transaksi ini dari catatan bersama?")) return;
  appState.transactions = appState.transactions.filter((t) => t.id !== txId);
  persistState();
};

function resetTxForm() {
  document.getElementById("editTxId").value = "";
  document.getElementById("txAmount").value = "";
  document.getElementById("txMethod").value = "";
  document.getElementById("txNote").value = "";
  document.getElementById("txPartner").value = sessionConfig.activeUser;
  document.getElementById("txDate").valueAsDate = new Date();
  document.getElementById("txFormTitle").textContent = "➕ Catat Setoran / Penyesuaian";
  document.getElementById("btnSubmitTx").textContent = "Simpan Transaksi Realtime";
  document.getElementById("btnCancelEditTx").classList.add("hidden");
}

document.getElementById("btnCancelEditTx").addEventListener("click", resetTxForm);

// Chart.js Visualization
document.querySelectorAll(".tab-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    chartMode = btn.dataset.chart;
    renderChart(computeSummary());
  });
});

function renderChart(stats) {
  const ctx = document.getElementById("savingsChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  if (chartMode === "partner") {
    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [appState.meta.partner1, appState.meta.partner2, "Rekening Bersama"],
        datasets: [
          {
            data: [stats.fajarNet, stats.selvianaNet, stats.bersamaNet],
            backgroundColor: ["#5C7A67", "#B86B52", "#C59B6D"],
            borderWidth: 2,
            borderColor: "#FFFFFF"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  } else {
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: appState.categories.map((c) => c.name),
        datasets: [
          {
            label: "Terkumpul",
            data: appState.categories.map((c) => stats.categoryTotals[c.id] || 0),
            backgroundColor: "#5C7A67",
            borderRadius: 6
          },
          {
            label: "Target",
            data: appState.categories.map((c) => c.target),
            backgroundColor: "#E6DFD3",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }
}

// Export CSV
document.getElementById("btnExportCsv").addEventListener("click", () => {
  const catMap = Object.fromEntries(appState.categories.map((c) => [c.id, c.name]));
  const rows = [
    ["Tanggal", "Jenis", "Kontributor", "Pos Anggaran", "Nominal", "Metode", "Catatan"],
    ...appState.transactions.map((t) => [
      t.date,
      t.type,
      t.partner,
      `"${(catMap[t.categoryId] || "").replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.method || "").replace(/"/g, '""')}"`,
      `"${(t.note || "").replace(/"/g, '""')}"`
    ])
  ];
  const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `tabungan-wedding-${sessionConfig.roomId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// Settings Modal
const settingsModal = document.getElementById("settingsModal");
document.getElementById("btnOpenSettings").addEventListener("click", () => {
  document.getElementById("setPartner1").value = appState.meta.partner1;
  document.getElementById("setPartner2").value = appState.meta.partner2;
  document.getElementById("setWeddingDate").value = appState.meta.weddingDate;
  document.getElementById("setPin").value = appState.meta.pin;
  document.getElementById("setFirebaseUrl").value = sessionConfig.firebaseUrl || "";
  settingsModal.classList.remove("hidden");
});

document.getElementById("btnCloseSettings").addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

document.getElementById("settingsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  appState.meta.partner1 = document.getElementById("setPartner1").value.trim();
  appState.meta.partner2 = document.getElementById("setPartner2").value.trim();
  appState.meta.weddingDate = document.getElementById("setWeddingDate").value;
  appState.meta.pin = document.getElementById("setPin").value.trim();

  const newUrl = document.getElementById("setFirebaseUrl").value.trim();
  const urlChanged = newUrl !== sessionConfig.firebaseUrl;
  sessionConfig.firebaseUrl = newUrl;
  saveSessionConfig();

  settingsModal.classList.add("hidden");
  if (urlChanged) {
    initRealtimeSync();
  } else {
    persistState();
  }
});

document.getElementById("btnResetDemo").addEventListener("click", () => {
  if (!confirm("Reset semua data ke saldo awal default?")) return;
  appState = structuredClone(DEFAULT_STATE);
  settingsModal.classList.add("hidden");
  persistState();
});

// Boot
loadSavedSession();
