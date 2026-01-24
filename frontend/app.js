const API_BASE = "https://daiho-auto-parts-2.onrender.com";

const saleBody = document.getElementById("saleBody");
const grossSaleEl = document.getElementById("grossSale");
const totalCostEl = document.getElementById("totalCost");
const totalProfitEl = document.getElementById("totalProfit");

const btnAddSale = document.getElementById("btnAddSale");
const btnData = document.getElementById("btnData");
const btnDownload = document.getElementById("btnDownload");
const datePicker = document.getElementById("datePicker");

const addOverlay = document.getElementById("addOverlay");
const dataOverlay = document.getElementById("dataOverlay");
const editOverlay = document.getElementById("editOverlay");       // SALE edit modal
const editDataOverlay = document.getElementById("editDataOverlay"); // DATA edit modal

const addItem = document.getElementById("addItem");
const addQty = document.getElementById("addQty");
const addInvestment = document.getElementById("addInvestment");
const addPrice = document.getElementById("addPrice");
const confirmAdd = document.getElementById("confirmAdd");
const cancelAdd = document.getElementById("cancelAdd");

const dataItem = document.getElementById("dataItem");
const dataTotal = document.getElementById("dataTotal");
const confirmData = document.getElementById("confirmData");
const cancelData = document.getElementById("cancelData");

// SALE edit modal fields
const editItem = document.getElementById("editItem");
const editQty = document.getElementById("editQty");
const editInvestment = document.getElementById("editInvestment");
const editPrice = document.getElementById("editPrice");
const confirmEdit = document.getElementById("confirmEdit");
const returnEdit = document.getElementById("returnEdit");
const deleteEdit = document.getElementById("deleteEdit");
const cancelEdit = document.getElementById("cancelEdit");

// DATA edit modal fields
const editDataItem = document.getElementById("editDataItem");
const editDataTotal = document.getElementById("editDataTotal");
const confirmEditData = document.getElementById("confirmEditData");
const deleteEditData = document.getElementById("deleteEditData");
const cancelEditData = document.getElementById("cancelEditData");

let currentDate = new Date().toISOString().slice(0,10);
datePicker.value = currentDate;

let currentRowId = null;
let currentRowType = null;

// Helpers
function format(n){ return Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function showAdd(){ addOverlay.classList.remove("hidden"); }
function hideAdd(){ addOverlay.classList.add("hidden"); }
function showData(){ dataOverlay.classList.remove("hidden"); }
function hideData(){ dataOverlay.classList.add("hidden"); }
function showEdit(){ editOverlay.classList.remove("hidden"); }
function hideEdit(){ editOverlay.classList.add("hidden"); currentRowId=null; currentRowType=null; }
function showEditData(){ editDataOverlay.classList.remove("hidden"); }
function hideEditData(){ editDataOverlay.classList.add("hidden"); currentRowId=null; currentRowType=null; }

// Row template
function rowTemplate(r){
  const isData = r.type === "DATA";
  const isReturned = r.status === "RETURNED";
  const qty = isData ? "N/A" : r.qty;
  const inv = isData ? "N/A" : format(r.investment);
  const price = isData ? "N/A" : format(r.price);
  const total = format(r.total);
  const profit = isData ? "N/A" : format(r.profit);

  const tr = document.createElement("tr");
  if (isData) tr.classList.add("row-data");
  if (isReturned) tr.classList.add("row-returned");

  // dynamic button label and class
  const btnLabel = isReturned ? "Restore" : "Edit";
  const btnClass = isReturned ? "btn btn-edit btn-restore" : "btn btn-edit";

  tr.innerHTML = `
    <td>${qty}</td>
    <td>${r.item}</td>
    <td>${inv}</td>
    <td>${price}</td>
    <td>${total}</td>
    <td>${profit}</td>
    <td><button class="${btnClass}" data-id="${r.id}" data-type="${r.type}" data-status="${r.status}">${btnLabel}</button></td>
  `;
  return tr;
}

function renderRows(rows){
  saleBody.innerHTML="";
  rows.forEach(r=>saleBody.appendChild(rowTemplate(r)));
  attachRowEvents();
}

function attachRowEvents(){
  document.querySelectorAll(".btn-edit").forEach(btn=>{
    btn.onclick=async()=>{
      currentRowId=btn.dataset.id;
      currentRowType=btn.dataset.type;
      const status=btn.dataset.status;

      if(currentRowType==="SALE"){
        if(status==="RETURNED"){
          // restore immediately
          await fetch(`${API_BASE}/sales/${currentRowId}/toggle`,{method:"PUT"});
          await loadForDate(currentDate);
        } else {
          // open edit modal
          const res=await fetch(`${API_BASE}/sales/${currentRowId}`);
          const row=await res.json();
          editItem.value=row.item;
          editQty.value=row.qty;
          editInvestment.value=row.investment;
          editPrice.value=row.price;
          showEdit();
        }
      } else {
        // DATA workflow
        const res=await fetch(`${API_BASE}/sales/${currentRowId}`);
        const row=await res.json();
        editDataItem.value=row.item;
        editDataTotal.value=row.total;
        showEditData();
      }
    };
  });
}

function renderTotals(t){
  grossSaleEl.textContent=format(t.gross_sale);
  totalCostEl.textContent=format(t.total_investment);
  totalProfitEl.textContent=format(t.total_profit);
}

// Load data
async function loadForDate(dateStr){
  document.getElementById("loading").classList.remove("hidden");
  const res=await fetch(`${API_BASE}/sales?date=${dateStr}`);
  const data=await res.json();
  renderRows(data.rows);
  renderTotals(data.totals);
  document.getElementById("loading").classList.add("hidden");
}

// Add Sale
confirmAdd.onclick=async()=>{
  const item=addItem.value.trim();
  const qty=Number(addQty.value);
  const investment=Number(addInvestment.value);
  const price=Number(addPrice.value);
  if(!item||qty<=0){alert("Please provide valid Item and Quantity.");return;}
  if(investment>price){alert("Bawal: dapat mas mataas ang Price kaysa Investment.");return;}
  const body={date:currentDate,item,qty,investment,price,type:"SALE"};
  await fetch(`${API_BASE}/sales`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  hideAdd();
  await loadForDate(currentDate);
};

// Add Data
confirmData.onclick=async()=>{
  const item=dataItem.value.trim();
  const total=Number(dataTotal.value);
  if(!item||total<0){alert("Please provide valid Item and Total.");return;}
  const body={date:currentDate,item,total,type:"DATA"};
  await fetch(`${API_BASE}/sales`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  hideData();
  await loadForDate(currentDate);
};

// Edit SALE workflow
confirmEdit.onclick=async()=>{
  if(!currentRowId)return;
  const body={
    type:"SALE",
    item:editItem.value,
    qty:Number(editQty.value),
    investment:Number(editInvestment.value),
    price:Number(editPrice.value)
  };
  await fetch(`${API_BASE}/sales/${currentRowId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  hideEdit();
  await loadForDate(currentDate);
};

returnEdit.onclick=async()=>{
  if(!currentRowId)return;
  await fetch(`${API_BASE}/sales/${currentRowId}/toggle`,{method:"PUT"});
  hideEdit();
  await loadForDate(currentDate);
};

deleteEdit.onclick=async()=>{
  if(!currentRowId)return;
  await fetch(`${API_BASE}/sales/${currentRowId}`,{method:"DELETE"});
  hideEdit();
  await loadForDate(currentDate);
};

cancelEdit.onclick=hideEdit;

// Edit DATA workflow
confirmEditData.onclick=async()=>{
  if(!currentRowId)return;
  const body={
    type:"DATA",
    item:editDataItem.value,
    total:Number(editDataTotal.value)
  };
  await fetch(`${API_BASE}/sales/${currentRowId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  hideEditData();
  await loadForDate(currentDate);
};

deleteEditData.onclick=async()=>{
  if(!currentRowId)return;
  await fetch(`${API_BASE}/sales/${currentRowId}`,{method:"DELETE"});
  hideEditData();
  await loadForDate(currentDate);
};

cancelEditData.onclick=hideEditData;

// Cancel buttons
cancelAdd.onclick=hideAdd;
cancelData.onclick=hideData;

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



