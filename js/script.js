// --- Online Orders ---
const orderForm = document.getElementById("orderForm");
const orderList = document.getElementById("orderList");

orderForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const customer = document.getElementById("orderCustomer").value;
    const item = document.getElementById("orderItem").value;

    const li = document.createElement("li");
    li.textContent = `${customer} ordered ${item}`;
    orderList.appendChild(li);

    orderForm.reset();
});

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
