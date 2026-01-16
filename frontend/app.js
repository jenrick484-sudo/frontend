// --- Config ---
const API_BASE = "https://daiho-auto-parts-2.onrender.com"; // update after deploy

// --- Elements ---
const saleBody = document.getElementById("saleBody");
const grossSaleEl = document.getElementById("grossSale");
const totalCostEl = document.getElementById("totalCost");
const totalProfitEl = document.getElementById("totalProfit");

const btnAddSale = document.getElementById("btnAddSale");
const btnData = document.getElementById("btnData");
const btnDownload = document.getElementById("btnDownload");
const datePicker = document.getElementById("datePicker");

const addOverlay = document.getElementById("addOverlay");
const addItem = document.getElementById("addItem");
const addQty = document.getElementById("addQty");
const addInvestment = document.getElementById("addInvestment");
const addPrice = document.getElementById("addPrice");
const confirmAdd = document.getElementById("confirmAdd");
const cancelAdd = document.getElementById("cancelAdd");

const dataOverlay = document.getElementById("dataOverlay");
const dataItem = document.getElementById("dataItem");
const dataTotal = document.getElementById("dataTotal");
const confirmData = document.getElementById("confirmData");
const cancelData = document.getElementById("cancelData");

// --- State ---
let currentDate = new Date().toISOString().slice(0,10); // yyyy-mm-dd
datePicker.value = currentDate;

// --- Helpers ---
function format(n){
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function showAdd(){ addOverlay.classList.remove("hidden"); }
function hideAdd(){ addOverlay.classList.add("hidden"); addItem.value=""; addQty.value=""; addInvestment.value=""; addPrice.value=""; }
function showData(){ dataOverlay.classList.remove("hidden"); }
function hideData(){ dataOverlay.classList.add("hidden"); dataItem.value=""; dataTotal.value=""; }

function rowTemplate(r){
  const isData = r.type === "DATA";
  const isReturned = r.status === "RETURNED";
  const qty = isData ? "N/A" : r.qty;
  const inv = isData ? "N/A" : format(r.investment);
  const price = isData ? "N/A" : format(r.price);
  const total = format(r.total);
  const profit = isData ? "N/A" : format(r.profit);

  const tr = document.createElement("tr");
  if(isData) tr.classList.add("row-data");
  if(isReturned) tr.classList.add("row-returned");

  tr.innerHTML = `
    <td>${qty}</td>
    <td>${r.item}</td>
    <td>${inv}</td>
    <td>${price}</td>
    <td>${total}</td>
    <td>${profit}</td>
    <td>
      ${isData ? `
        <button class="btn danger btn-delete" data-id="${r.id}">Delete</button>
      ` : `
        <button class="btn ${isReturned?'info':'danger'} btn-toggle" data-id="${r.id}">
          ${isReturned?'Restore':'Return'}
        </button>
      `}
    </td>
  `;
  return tr;
}

function renderRows(rows){
  saleBody.innerHTML = "";
  rows.forEach(r => saleBody.appendChild(rowTemplate(r)));
  attachRowEvents();
}

function attachRowEvents(){
  document.querySelectorAll(".btn-toggle").forEach(btn=>{
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await fetch(`${API_BASE}/sales/${id}/toggle`, { method:"PUT" });
      await loadForDate(currentDate);
    };
  });
  document.querySelectorAll(".btn-delete").forEach(btn=>{
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await fetch(`${API_BASE}/sales/${id}`, { method:"DELETE" });
      await loadForDate(currentDate);
    };
  });
}

function renderTotals(t){
  grossSaleEl.textContent = format(t.gross_sale);
  totalCostEl.textContent = format(t.total_investment);
  totalProfitEl.textContent = format(t.total_profit);
}

// --- Load data for date ---
async function loadForDate(dateStr){
  const res = await fetch(`${API_BASE}/sales?date=${dateStr}`);
  const data = await res.json();
  renderRows(data.rows);
  renderTotals(data.totals);
}

// --- Add sale ---
confirmAdd.onclick = async () => {
  const item = addItem.value.trim();
  const qty = Number(addQty.value);
  const investment = Number(addInvestment.value);
  const price = Number(addPrice.value);

  if(!item || qty<=0){ alert("Please provide valid Item and Quantity."); return; }
  if(investment > price){
    alert("Bawal: dapat mas mataas ang Price kaysa Investment.");
    return;
  }

  const body = { date: currentDate, item, qty, investment, price, type:"SALE" };
  await fetch(`${API_BASE}/sales`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  hideAdd();
  await loadForDate(currentDate);
};

// --- Add DATA ---
confirmData.onclick = async () => {
  const item = dataItem.value.trim();
  const total = Number(dataTotal.value);
  if(!item || total<0){ alert("Please provide valid Item and Total."); return; }

  const body = { date: currentDate, item, total, type:"DATA" };
  await fetch(`${API_BASE}/sales`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  hideData();
  await loadForDate(currentDate);
};

// --- Cancel buttons ---
cancelAdd.onclick = hideAdd;
cancelData.onclick = hideData;

// --- Top controls ---
btnAddSale.onclick = showAdd;
btnData.onclick = showData;

datePicker.onchange = async (e) => {
  currentDate = e.target.value;
  await loadForDate(currentDate);
};

// --- Download CSV ---
btnDownload.onclick = async () => {
  const res = await fetch(`${API_BASE}/export?date=${currentDate}`);
  const csv = await res.text();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales_${currentDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// --- Init ---

loadForDate(currentDate);
