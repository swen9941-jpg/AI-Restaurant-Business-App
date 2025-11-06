// --- Inventory Management ---
const inventoryForm = document.getElementById("inventoryForm");
const inventoryList = document.getElementById("inventoryList");
let inventory = {};

inventoryForm.addEventListener("submit", function(e){
    e.preventDefault();
    const item = document.getElementById("inventoryItem").value;
    const qty = parseInt(document.getElementById("inventoryQty").value);

    if(inventory[item]) {
        inventory[item] += qty;
    } else {
        inventory[item] = qty;
    }
    renderInventory();
    inventoryForm.reset();
});

function renderInventory() {
    inventoryList.innerHTML = "";
    for(let item in inventory){
        const li = document.createElement("li");
        li.textContent = `${item} - Quantity: ${inventory[item]}`;
        inventoryList.appendChild(li);
    }
}

// --- Online Orders ---
const orderForm = document.getElementById("orderForm");
const orderList = document.getElementById("orderList");
let orders = [];
let salesCount = {};
let totalRevenue = 0;

orderForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const customer = document.getElementById("orderCustomer").value;
    const item = document.getElementById("orderItem").value;

    // Decrease inventory
    if(inventory[item] && inventory[item] > 0){
        inventory[item]--;
        renderInventory();
    } else {
        alert(`${item} is out of stock!`);
        return;
    }

    orders.push({ customer, item, amount: 10 }); // Assume $10 per item
    totalRevenue += 10;
    
    // Track sales count per item
    salesCount[item] = (salesCount[item] || 0) + 1;

    renderOrders();
    renderSales();
    renderAI();
    orderForm.reset();
});

function renderOrders(){
    orderList.innerHTML = "";
    orders.forEach(o => {
        const li = document.createElement("li");
        li.textContent = `${o.customer} ordered ${o.item}`;
        orderList.appendChild(li);
    });
}

// --- Sales Summary ---
const totalOrdersEl = document.getElementById("totalOrders");
const totalRevenueEl = document.getElementById("totalRevenue");
const topItemsEl = document.getElementById("topItems");

function renderSales(){
    totalOrdersEl.textContent = orders.length;
    totalRevenueEl.textContent = totalRevenue.toFixed(2);

    // Top 3 items
    const sortedItems = Object.entries(salesCount).sort((a,b) => b[1]-a[1]).slice(0,3);
    topItemsEl.innerHTML = "";
    sortedItems.forEach(([item, count]) => {
        const li = document.createElement("li");
        li.textContent = `${item} - Sold: ${count}`;
        topItemsEl.appendChild(li);
    });
}

// --- Staff Management ---
const staffForm = document.getElementById("staffForm");
const staffList = document.getElementById("staffList");
let staffData = {};

staffForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("staffName").value;
    const action = document.getElementById("staffAction").value;
    const now = new Date();

    if(!staffData[name]) staffData[name] = { checkin: null, totalHours: 0 };

    if(action === "checkin") {
        staffData[name].checkin = now;
        alert(`${name} checked in at ${now.toLocaleTimeString()}`);
    } else if(action === "checkout") {
        if(staffData[name].checkin) {
            const hoursWorked = (now - staffData[name].checkin) / (1000*60*60);
            staffData[name].totalHours += hoursWorked;
            staffData[name].checkin = null;
            alert(`${name} checked out. Hours worked: ${hoursWorked.toFixed(2)}`);
        } else {
            alert(`${name} hasn't checked in yet!`);
        }
    }

    renderStaff();
    staffForm.reset();
});

function renderStaff() {
    staffList.innerHTML = "";
    for(let name in staffData) {
        const li = document.createElement("li");
        li.textContent = `${name} - Total Hours: ${staffData[name].totalHours.toFixed(2)}`;
        staffList.appendChild(li);
    }
}

// --- Expenses ---
const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const expenseTotal = document.getElementById("expenseTotal");
let expenses = [];

expenseForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("expenseName").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    expenses.push({ name, amount });

    renderExpenses();
    expenseForm.reset();
});

function renderExpenses() {
    expenseList.innerHTML = "";
    let total = 0;
    expenses.forEach(exp => {
        const li = document.createElement("li");
        li.textContent = `${exp.name}: $${exp.amount.toFixed(2)}`;
        expenseList.appendChild(li);
        total += exp.amount;
    });
    expenseTotal.textContent = total.toFixed(2);
}

// --- AI Insights ---
const aiList = document.getElementById("aiList");

function renderAI(){
    aiList.innerHTML = "";
    // Low stock alerts
    for(let item in inventory){
        if(inventory[item] <= 2){
            const li = document.createElement("li");
            li.textContent = `Low stock alert: ${item} (${inventory[item]} left)`;
            aiList.appendChild(li);
        }
    }
    // Top selling item suggestion
    const top = Object.entries(salesCount).sort((a,b) => b[1]-a[1])[0];
    if(top){
        const li = document.createElement("li");
        li.textContent = `Top-selling item: ${top[0]} - Consider promoting similar items!`;
        aiList.appendChild(li);
    }
}
