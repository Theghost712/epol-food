/* ===============================
   AUTH MANAGER
   =============================== */
const AuthManager = {
  checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const path = window.location.pathname;
    let page = path.split("/").pop().split("?")[0];

    // Handle root path or empty segment (e.g. localhost/EPOL-CAFTERIA/)
    if (page === "") page = "index.html";

    const publicPages = ['login.html', 'register.html'];

    // 1. If NOT logged in and trying to access a protected page -> Go to Login
    if (!isLoggedIn && !publicPages.includes(page)) {
      window.location.href = 'login.html';
    }

    // 2. If Logged in and trying to access Login/Register -> Go to Dashboard
    if (isLoggedIn && publicPages.includes(page)) {
      window.location.href = 'index.html';
    }
  },

  login() {
    localStorage.setItem('isLoggedIn', 'true');
  },

  logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
  },

  updateNavigation() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    
    loginLinks.forEach(link => {
      if (isLoggedIn) {
        link.textContent = "Logout";
        link.href = "#";
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }
    });
  }
};


// Run Auth Check immediately
AuthManager.checkAuth();

/* ===============================
   CART MANAGER
=============================== */
const CartManager = {
  items: JSON.parse(localStorage.getItem("cart")) || [],

  init() {
    this.updateCartCount();
    this.bindEvents();
  },

  bindEvents() {
    // Handle "Add to Cart" buttons using Event Delegation (for dynamic items)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('js-add-to-cart')) {
        const btn = e.target;
        const id = btn.dataset.id;
        const product = btn.dataset.product;
        const price = btn.dataset.price;
        this.add(id, product, price);
      }
    });

    // Handle "Clear Cart" button
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clear();
      });
    }

    // Handle "Remove Item" from cart using delegation
    const cartItemsEl = document.getElementById('cartItems');
    if (cartItemsEl) {
      cartItemsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
          const index = e.target.dataset.index;
          this.removeItem(parseInt(index));
        }
      });
    }
  },

  updateCartCount() {
    const el = document.getElementById("cartCount");
    if (el) el.textContent = this.items.length;
  },

  add(id, name, price) {
    const item = { id, name, price };
    this.items.push(item);
    this.save();
    this.updateCartCount();
    
    alert(`${name} added to cart!`);
  },

  save() {
    localStorage.setItem("cart", JSON.stringify(this.items));
  },

  // Call this if you have a cart.html page
  loadCartDisplay() {
    const list = document.getElementById("cartItems");
    const totalContainer = document.getElementById("cartTotalContainer");
    const totalDisplay = document.getElementById("cartTotalDisplay");
    
    if (!list) return;

    list.innerHTML = "";
    let total = 0;

    if (this.items.length === 0) {
      list.innerHTML = "<li>Your cart is empty.</li>";
      if (totalContainer) totalContainer.style.display = "none";
      return;
    }

    if (totalContainer) totalContainer.style.display = "block";

    this.items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      
      let name = item;
      let price = 0;

      // Handle both old string items and new object items
      if (typeof item === 'object') {
        name = item.name;
        price = parseInt(item.price || 0);
      }
      
      total += price;

      li.innerHTML = `
        <div class="cart-item-info">
          <strong>${name}</strong>
          <span>Tsh ${price}</span>
        </div>
        <button class="btn-remove" data-index="${index}">Remove</button>
      `;
      list.appendChild(li);
    });
    
    if (totalDisplay) totalDisplay.textContent = `Tsh ${total}`;
  },

  removeItem(index) {
    this.items.splice(index, 1);
    this.save();
    this.updateCartCount();
    this.loadCartDisplay();
  },

  loadCheckoutDisplay() {
    const list = document.getElementById("checkoutItems");
    const totalEl = document.getElementById("checkoutTotal");
    if (!list || !totalEl) return;

    list.innerHTML = "";
    let total = 0;

    this.items.forEach(item => {
      const li = document.createElement("li");
      li.className = "order-item";
      
      const price = (typeof item === 'object' && item.price) ? parseInt(item.price) : 0;
      const name = (typeof item === 'object') ? item.name : item;
      
      li.innerHTML = `<span>${name}</span> <span>Tsh ${price}</span>`;
      list.appendChild(li);
      total += price;
    });

    totalEl.textContent = `Tsh ${total}`;
  },

  clear() {
    this.items = [];
    localStorage.removeItem("cart");
    this.loadCartDisplay();
    this.updateCartCount();
  }
};

/* ===============================
   FORM VALIDATOR
=============================== */
const FormValidator = {
  init() {
    const forms = document.querySelectorAll("form");
    forms.forEach(form => {
      // Validate on Submit
      form.addEventListener("submit", async e => {
        let isValid = true;
        const inputs = form.querySelectorAll("input");
        
        inputs.forEach(input => {
          if (!this.validateInput(input)) {
            isValid = false;
          }
        });

        if (!isValid) {
          e.preventDefault();
        } else {
          e.preventDefault();
          await this.handleFormSubmit(form);
        }
      });

      // Real-time Validation
      form.querySelectorAll("input").forEach(input => {
        input.addEventListener("blur", () => this.validateInput(input));
        input.addEventListener("input", () => {
          // Clear error immediately when user starts typing
          if (input.classList.contains("input-error")) {
            this.validateInput(input);
          }
        });
      });
    });
  },

  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    let url = '';
    let redirect = '';

    // Determine endpoint based on Form ID
    if (form.id === 'loginForm') {
      url = 'API/login.php';
      redirect = 'index.html';
    } else if (form.id === 'registerForm') {
      url = 'API/register.php';
      redirect = 'login.html';
    } else if (form.id === 'checkoutForm') {
      url = 'API/checkout.php';
      data.items = CartManager.items; // Attach cart items
      data.total = CartManager.items.reduce((sum, item) => sum + (parseInt(item.price)||0), 0);
      redirect = 'order-confirmation.html';
    } else if (form.id === 'contactForm') {
      url = 'API/contact.php';
    }

    if (!url) return;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (form.id === 'loginForm') AuthManager.login();
        if (form.id === 'checkoutForm') CartManager.clear();
        if (form.id === 'contactForm') { alert('Message sent!'); form.reset(); }
        else if (redirect) window.location.href = redirect;
      } else {
        alert(result.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server. Ensure you are running on XAMPP/WAMP.');
    }
  },

  showError(input, msg) {
    input.classList.add("input-error");
    input.classList.remove("input-success");
    const group = input.closest('.input-group');
    const errorEl = group ? group.querySelector('.error-msg') : null;
    if (errorEl) errorEl.textContent = msg;
  },

  showSuccess(input) {
    input.classList.remove("input-error");
    input.classList.add("input-success");
    const group = input.closest('.input-group');
    const errorEl = group ? group.querySelector('.error-msg') : null;
    if (errorEl) errorEl.textContent = "";
  },

  validateInput(input) {
    const value = input.value.trim();
    const isRequired = input.hasAttribute("required");
    
    // 1. Check Required
    if (value === "") {
      if (isRequired) {
        this.showError(input, "This field is required");
        return false;
      } else {
        this.showSuccess(input);
        return true;
      }
    }

    // 2. Check Email
    if (input.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showError(input, "Please enter a valid email");
        return false;
      }
    }

    // 3. Check Password Length
    if (input.type === "password" && value.length < 6) {
      this.showError(input, "Password must be at least 6 characters");
      return false;
    }

    this.showSuccess(input);
    return true;
  }
};

/* ===============================
   INITIALIZATION
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  CartManager.init();
  FormValidator.init();
  AuthManager.updateNavigation();
  
  // If we are on the cart page, load the items
  if (document.getElementById("cartItems")) {
    CartManager.loadCartDisplay();
  }

  if (document.getElementById("checkoutItems")) {
    CartManager.loadCheckoutDisplay();
  }

  // Load Menu from Database if on menu page
  if (document.getElementById("menuContainer")) {
    loadMenu();
  }
});

async function loadMenu() {
  try {
    const response = await fetch('API/products.php');
    const products = await response.json();
    const container = document.getElementById('menuContainer');
    
    container.innerHTML = products.map(p => `
      <article class="product-card">
        <img src="${p.image_url || 'https://via.placeholder.com/500'}" alt="${p.name}" class="card-img">
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <p class="card-desc">${p.description}</p>
          <p class="card-price">Tsh ${p.price}</p>
          <button type="button" class="btn js-add-to-cart" data-id="${p.id}" data-product="${p.name}" data-price="${p.price}">Add to Cart</button>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Failed to load menu', err);
  }
}


