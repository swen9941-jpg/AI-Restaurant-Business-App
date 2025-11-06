// --------- Helper / Persistence ----------
const STORE_KEY = "pos_app_v1";

function saveState(state){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}
function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw) return null;
  try { return JSON.parse(raw) } catch(e){ return null }
}

// --------- Default demo data ----------
const defaultState = {
  products: {
    "Fries Classic": { price: 3.50, qty: 20 },
    "Cheesy Fries": { price: 4.50, qty: 12 },
    "Bacon Fries": { price: 5.50, qty: 8 },
    "Burger": { price: 7.00, qty: 6 },
    "Soda": { price: 1.50, qty: 30 }
  },
  orders: [], // {id, items:[{name,price}], total, time, status}
  staff: {}, // name -> {checkin:timestamp|null, totalHours: number}
  expenses: [] // {name, amount, time}
};

let state = loadState() || defaultState;
saveState(state); // ensure saved

// --------- DOM elements ---------
const productsGrid = document.getElementById("productsGrid");
const cartList = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const placeOrderBtn = document.getElementById("placeOrder");
const ordersList = document.getElementById("ordersList");
const insightsList = document.getElementById("insightsList");
const statOrders = document.getElementById("statOrders");
const statRevenue = document.getElementById("statRevenue");

// modals
const inventoryModal = document.getElementById("inventoryModal");
const inventoryList = document.getElementById("inventoryList");
const inventoryForm = document.getElementById("inventoryForm");
const invName = document.getElementById("invName");
const invQty = document.getElementById("invQty");
const invPrice = document.getElementById("invPrice");
const openInventory = document.getElementById("openInventory");
const closeInventory = document.getElementById("closeInventory");

const staffModal = document.getElementById("staffModal");
const staffForm = document.getElementById("staffForm");
const staffListUI = document.getElementById("staffList");
const openStaff = document.getElementById("openStaff");
const closeStaff = document.getElementById("closeStaff");

const expensesModal = document.getElementById("expensesModal");
const expenseForm = document.getElementById("expenseForm");
const expenseListUI = document.getElementById("expenseList");
const expenseTotal = document.getElementById("expenseTotal");
const openExpenses = document.getElementById("openExpenses");
const closeExpenses = document.getElementById("closeExpenses");

const clearDataBtn = document.getElementById("clearData");

// --------- App runtime variables ----------
let cart = [];

// --------- Render functions ----------
function renderProducts(){
  productsGrid.innerHTML = "";
  for(const [name, info] of Object.entries(state.products)){
    const card = document.createElement("div");
    card.className = "product-card";

    const title = document.createElement("div"); title.className = "p-title"; title.textContent = name;
    const price = document.createElement("div"); price.className = "p-price"; price.textContent = `$${info.price.toFixed(2)}`;
    const qty = document.createElement("div"); qty.className = "p-qty"; qty.textContent = `Stock: ${info.qty}`;

    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(qty);

    if(info.qty <= 2){
      const badge = document.createElement("div");
      badge.className = "badge-low";
      badge.textContent = "LOW";
      card.appendChild(badge);
    }

    const btn = document.createElement("button");
    btn.textContent = "Add to cart";
    btn.disabled = info.qty <= 0;
    btn.onclick = ()=> addToCart(name);
    card.appendChild(btn);

    productsGrid.appendChild(card);
  }
}

function addToCart(name){
  const prod = state.products[name];
  if(!prod || prod.qty <=0) return alert(`${name} is out of stock`);
  cart.push({ name, price: prod.price });
  renderCart();
}

function renderCart(){
  cartList.innerHTML = "";
  let total = 0;
  cart.forEach((it, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<div>${it.name}</div><div>$${it.price.toFixed(2)}</div>`;
    li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center";
    // remove button
    const rm = document.createElement("button"); rm.className="btn small"; rm.textContent="x";
    rm.onclick = ()=> { cart.splice(i,1); renderCart(); };
    li.appendChild(rm);
    cartList.appendChild(li);
    total += it.price;
  });
  cartTotalEl.textContent = total.toFixed(2);
}

// place order
placeOrderBtn.addEventListener("click", ()=>{
  if(cart.length===0) return alert("Cart empty");
  // reduce stock, create order
  for(const it of cart){
    if(state.products[it.name].qty <= 0){
      alert(`${it.name} out of stock — remove from cart`);
      return;
    }
  }

  // deduct stock
  cart.forEach(it => state.products[it.name].qty -= 1);

  const order = {
    id: "O" + Date.now(),
    items: [...cart],
    total: cart.reduce((s, i)=>s + i.price, 0),
    time: new Date().toISOString(),
    status: "Pending"
  };
  state.orders.push(order);
  cart = [];
  saveState(state);
  renderAll();
  alert("Order placed!");
});

// orders rendering and controls
function renderOrders(){
  ordersList.innerHTML = "";
  // show most recent first
  const list = [...state.orders].reverse();
  list.forEach(o=>{
    const li = document.createElement("li");
    const time = new Date(o.time).toLocaleTimeString();
    const content = document.createElement("div");
    content.innerHTML = `<strong>${o.id}</strong> • ${o.items.map(i=>i.name).join(", ")} <div style="font-size:12px;color:var(--muted)">\$${o.total.toFixed(2)} • ${time}</div>`;
    li.appendChild(content);

    const btnWrap = document.createElement("div");
    const statusBtn = document.createElement("button");
    statusBtn.className = "btn small";
    statusBtn.textContent = o.status === "Pending" ? "Mark Done" : "Done";
    statusBtn.onclick = ()=>{
      o.status = o.status === "Pending" ? "Completed" : "Completed";
      saveState(state); renderAll();
    };
    btnWrap.appendChild(statusBtn);

    // refund / remove order (restock)
    const refundBtn = document.createElement("button");
    refundBtn.className = "btn small";
    refundBtn.textContent = "Refund";
    refundBtn.onclick = ()=>{
      // restock items
      o.items.forEach(i => {
        if(state.products[i.name]) state.products[i.name].qty += 1;
      });
      // remove the order
      state.orders = state.orders.filter(x => x.id !== o.id);
      saveState(state); renderAll();
    };
    btnWrap.appendChild(refundBtn);

    li.appendChild(btnWrap);
    ordersList.appendChild(li);
  });
}

// insights: low-stock and top sellers
function renderInsights(){
  insightsList.innerHTML = "";
  // low stock
  for(const [name, p] of Object.entries(state.products)){
    if(p.qty <= 2){
      const li = document.createElement("li");
      li.textContent = `Low stock: ${name} (${p.qty} left) — consider restock or promotion`;
      insightsList.appendChild(li);
    }
  }
  // top sellers (count in orders)
  const counts = {};
  state.orders.forEach(o=>{
    o.items.forEach(i => counts[i.name] = (counts[i.name]||0) + 1);
  });
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
  if(top.length){
    top.forEach(([name, c])=>{
      const li = document.createElement("li");
      li.textContent = `Top seller: ${name} — sold ${c} times today`;
      insightsList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "No sales yet — start taking orders!";
    insightsList.appendChild(li);
  }
}

// stats
function renderStats(){
  statOrders.textContent = state.orders.length;
  const revenue = state.orders.reduce((s,o)=>s+o.total, 0);
  statRevenue.textContent = `$${revenue.toFixed(2)}`;
}

// inventory modal functions
openInventory.onclick = ()=> inventoryModal.setAttribute("aria-hidden", "false");
closeInventory.onclick = ()=> inventoryModal.setAttribute("aria-hidden", "true");

inventoryForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = invName.value.trim();
  const qty = parseInt(invQty.value,10);
  const price = parseFloat(invPrice.value);
  if(!name) return;
  state.products[name] = state.products[name] || { price: price || 0, qty: 0 };
  state.products[name].qty = (state.products[name].qty || 0) + qty;
  // update price if provided
  if(!isNaN(price) && price>0) state.products[name].price = price;
  saveState(state);
  invName.value=''; invQty.value=''; invPrice.value='';
  renderAll();
});

function renderInventoryList(){
  inventoryList.innerHTML = "";
  for(const [name, p] of Object.entries(state.products)){
    const li = document.createElement("li");
    li.innerHTML = `<strong>${name}</strong> — ${p.qty} in stock • $${p.price.toFixed(2)} `;
    const edit = document.createElement("button");
    edit.className="btn small";
    edit.textContent="Edit";
    edit.onclick = ()=>{
      // quick edit: prompt for qty change
      const add = parseInt(prompt("Add or subtract qty (use negative to subtract):", "0"),10);
      if(!isNaN(add)){ state.products[name].qty += add; if(state.products[name].qty<0) state.products[name].qty=0; saveState(state); renderAll(); }
    };
    li.appendChild(edit);
    inventoryList.appendChild(li);
  }
}

// staff modal
openStaff.onclick = ()=> staffModal.setAttribute("aria-hidden", "false");
closeStaff.onclick = ()=> staffModal.setAttribute("aria-hidden", "true");
staffForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const name = document.getElementById("staffName").value.trim();
  const action = document.getElementById("staffAction").value;
  if(!name) return;
  if(!state.staff[name]) state.staff[name] = { checkin: null, totalHours: 0 };
  if(action === "checkin"){
    state.staff[name].checkin = Date.now();
    alert(`${name} checked in`);
  } else {
    if(state.staff[name].checkin){
      const diff = Date.now() - state.staff[name].checkin;
      const hrs = diff / (1000*60*60);
      state.staff[name].totalHours += hrs;
      state.staff[name].checkin = null;
      alert(`${name} checked out — ${hrs.toFixed(2)} hrs`);
    } else {
      alert(`${name} has no check-in recorded`);
    }
  }
  saveState(state);
  renderAll();
});

function renderStaffList(){
  staffListUI.innerHTML = "";
  for(const [name, info] of Object.entries(state.staff)){
    const li = document.createElement("li");
    li.textContent = `${name} — hours: ${info.totalHours ? info.totalHours.toFixed(2) : "0.00"} ${info.checkin ? "• Checked in" : ""}`;
    staffListUI.appendChild(li);
  }
}

// expenses
openExpenses.onclick = ()=> expensesModal.setAttribute("aria-hidden", "false");
closeExpenses.onclick = ()=> expensesModal.setAttribute("aria-hidden", "true");

expenseForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const name = document.getElementById("expName").value.trim();
  const amount = parseFloat(document.getElementById("expAmount").value);
  if(!name || isNaN(amount)) return;
  state.expenses.push({ name, amount, time: new Date().toISOString() });
  saveState(state);
  document.getElementById("expName").value=''; document.getElementById("expAmount").value='';
  renderAll();
});

function renderExpenses(){
  expenseListUI.innerHTML = "";
  let total = 0;
  state.expenses.forEach(e=>{
    const li = document.createElement("li");
    li.textContent = `${e.name} — $${e.amount.toFixed(2)} • ${new Date(e.time).toLocaleString()}`;
    expenseListUI.appendChild(li);
    total += e.amount;
  });
  expenseTotal.textContent = total.toFixed(2);
}

// clear local data (for testing)
clearDataBtn.onclick = ()=>{
  if(confirm("Clear all saved data? This resets to default demo data.")){
    localStorage.removeItem(STORE_KEY);
    state = JSON.parse(JSON.stringify(defaultState));
    saveState(state);
    renderAll();
  }
}

// main render helper
function renderAll(){
  renderProducts();
  renderCart();
  renderOrders();
  renderInsights();
  renderStats();
  renderInventoryList();
  renderStaffList();
  renderExpenses();
}

// initial render
renderAll();
