// Open Modal
function openCustomProductModal(){
    document.getElementById("customProductModal").classList.remove("hidden");
}

// Close Modal
function closeCustomProductModal(){
    document.getElementById("customProductModal").classList.add("hidden");
    document.getElementById("customProdName").value="";
    document.getElementById("customProdPrice").value="";
}

// Add Custom Product Button
document.getElementById("addCustomProdBtn").onclick = ()=>{
    const name = document.getElementById("customProdName").value.trim();
    const price = parseFloat(document.getElementById("customProdPrice").value);
    if(!name || isNaN(price)) return alert("Enter valid name and price");
    cart.push({name, price});
    renderCart();
    closeCustomProductModal();
}

// Cancel Button
document.getElementById("cancelCustomProdBtn").onclick = closeCustomProductModal;
