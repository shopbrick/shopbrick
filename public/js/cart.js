const MAX_PRODUCT_COUNT = 10;
let cart;
let country;

function loadCart() {
  const savedCart = JSON.parse(localStorage.getItem('cart') || '{}');
  cart = Object.fromEntries(Object.entries(savedCart).filter(([_, {addedAt}]) => isNewerThanNDaysAgo(addedAt)))
  displayCartSize();
}

function isNewerThanNDaysAgo(date) {
  const now = new Date();
  const numDaysAgo = new Date();
  numDaysAgo.setDate(now.getDate() - 15);

  return new Date(date) > numDaysAgo;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCartSize();
}

function displayCartSize() {
  const cartSizeEls = document.getElementsByClassName('cartSize');
  const cartSize = Object.values(cart).reduce((cnt, item) => (cnt + item.qty), 0);

  for (const cartSizeEl of cartSizeEls) {
    if (cartSize) {
      cartSizeEl.textContent = cartSize > 9 ? '9+' : cartSize;
      cartSizeEl.classList.remove('invisible');
      cartSizeEl.classList.add('visible');
    } else {
      cartSizeEl.classList.remove('visible');
      cartSizeEl.classList.add('invisible');
    }
  };
}

function getProductVariant(pk) {
  const color = document.querySelector(`.productColor-${pk}.active`)?.getAttribute('data-value');
  const size = document.querySelector(`.productSize-${pk}.active`)?.getAttribute('data-value');
  // const size = products[pk].size;
  return [pk, color, size].filter(Boolean).map((v) => v.toLowerCase()).join('-');
}

function getProductQty(pk) {
  const productQtyEl = document.getElementById(`productQty-${pk}`);
  return parseInt(productQtyEl.value) ?? 0;
}

function getProductQtyEl(pk) {
  const productQtyEl = document.getElementById(`productQty-${pk}`);
  return {el: productQtyEl, qty: parseInt(productQtyEl?.value) ?? 0};
}

function incrementProduct(pk) {
  const qtyEl = getProductQtyEl(pk);
  if (qtyEl.qty < MAX_PRODUCT_COUNT) {
    qtyEl.el.value = qtyEl.qty + 1;
  }
}

function decrementProduct(pk) {
  const qtyEl = getProductQtyEl(pk);
  if (qtyEl.qty > 1) {
    qtyEl.el.value = qtyEl.qty - 1;
  }
}

function validateAndSetProductQuntity(pk) {
  const qtyEl = getProductQtyEl(pk)
  if (qtyEl.qty < 1) {
    qtyEl.el.value = 1;
  } else if (qtyEl.qty > MAX_PRODUCT_COUNT) {
    qtyEl.el.value = MAX_PRODUCT_COUNT;
  }
}

function selectColor(currentElement, pk) {
  const productColors = document.getElementsByClassName(`productColor-${pk}`);
  for (const element of productColors) {
    element.classList.remove('active');
  }
  currentElement.classList.add('active');
}

function selectSize(currentElement, pk) {
  const productSizes = document.getElementsByClassName(`productSize-${pk}`);
  for (const element of productSizes) {
    element.classList.remove('active');
  }
  currentElement.classList.add('active');
  if (products[pk].isSizeBasedPrice) {
    products[pk].size = currentElement.dataset.value;
    // updateAllProductsPrices();
    updateProductPrice(pk);
  }
}

function addProductToCart(pk) {
  const pvk = getProductVariant(pk);
  const qty = getProductQty(pk);
  const productName = products[pk].title;
  const productImg = products[pk].image;
  const color = document.querySelector(`.productColor-${pk}.active`)?.getAttribute('data-value');
  const size = document.querySelector(`.productSize-${pk}.active`)?.getAttribute('data-value');
  // const size = products[pk].size;
  const price = products[pk].isSizeBasedPrice ? products[pk].price[size] : products[pk].price;
  const stripePrices = products[pk].stripePrices[pvk];
  const productVariantName = [productName, color, size].filter(Boolean).join(' / ');
  const addedAt = new Date();
  cart[pvk] = ({pvk, pk, productVariantName, productName, productImg, color, size, qty, price, stripePrices, addedAt});
  saveCart();
}

function buyProductNow(pk) {
  try {
    const pvk = getProductVariant(pk);
    const itemQty = getProductQty(pk);
    const itemStripePrices = products[pk].stripePrices[pvk];
    const stripePrices = getStripePrices(itemStripePrices);
    const lineItems = [{price: stripePrices[currency], quantity: itemQty}];

    redirectToStripeCheckout(lineItems);

  } catch (error) {
    showError(error.message);
  }
}

function restoreProductsQty() {
  for (const pvk in cart) {
    const item = cart[pvk];
    const qtyEl = getProductQtyEl(item.pk);
    if (qtyEl.el) {
      qtyEl.el.value = item.qty;
      if (item.color) {
        const productColors = document.getElementsByClassName(`productColor-${item.pk}`);
        for (const element of productColors) {
          element.classList.remove('active');
        }
        document.getElementById(`productColor-${item.pk}-${item.color}`)?.classList.add('active');
      }
      if (item.size) {
        const productSizes = document.getElementsByClassName(`productSize-${item.pk}`);
        for (const element of productSizes) {
          element.classList.remove('active');
        }
        document.getElementById(`productSize-${item.pk}-${item.size}`)?.classList.add('active');
      }
    }
  }
}

function initCart() {
  loadCart();
  restoreProductsQty();
  country = JSON.parse(localStorage.getItem('country')) || getCountryCode();
  selectCountry(country);
  currency = JSON.parse(localStorage.getItem('currency')) || getCurrencyFromLocale();
  selectCurrency(currency);
  urgencyMessage();
};

function incrementItem(pvk) {
  if (cart[pvk].qty < MAX_PRODUCT_COUNT) {
    cart[pvk].qty += 1;
    document.getElementById(`itemQty-${pvk}`).value = cart[pvk].qty;
    saveCart();
    displayCartTotal();
  }
}

function decrementItem(pvk) {
  if (cart[pvk].qty > 1) {
    cart[pvk].qty -= 1;
    document.getElementById(`itemQty-${pvk}`).value = cart[pvk].qty;
    saveCart();
    displayCartTotal();
  }
}

function clearItem(pvk) {
  delete cart[pvk];
  saveCart();
  displayCartTotal();
  displayCart();
}

function getArrangedItems(cart) {
  const groupedItems = {};
  for (const item of Object.values(cart)) {
    if (item.pk in groupedItems) {
      groupedItems[item.pk].push(item);
    } else {
      groupedItems[item.pk] = [item];
    }
  }
  return Object.values(groupedItems).flat(1);
}

function displayCart() {
  const cartForm = document.getElementById('cartForm');
  if (cartForm) {
    const cartCount = Object.keys(cart).length;
    if (cartCount) {
      const cartItems = document.getElementById('cartItems');
      cartItems.innerHTML = '';

      let total = 0;
      for (const item of getArrangedItems(cart)) {
        const pvk = item.pvk;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('flex', 'flex-col', 'sm:flex-row', 'items-center', 'gap-3', 'sm:gap-6', 'bg-gray-100', 'dark:bg-gray-900', 'p-4', 'rounded-lg', 'shadow', 'sm:w-full', 'md:min-w-2xl');

        itemDiv.innerHTML = `
          <img src="${item.productImg}" alt="${item.productName}" class="w-60 h-60 object-cover rounded-lg">
          <div class="mt-4 flex-1">
            <h2 class="text-lg font-medium text-slate-900 dark:text-white">${item.productVariantName}</h2>
            <p class="text-gray-500 dark:text-gray-400">${formatCurrency(item.price[currency])}</p>
          </div>
          <div class="mt-4 flex gap-3 items-center justify-between">
            <div class="relative flex items-center max-w-[8rem]">
              <button type="button" onclick="decrementItem('${pvk}')"
                class="cursor-pointer bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg px-3 h-12 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
                </svg>
              </button>
              <input type="text" id="itemQty-${pvk}" data-input-counter aria-describedby="helper-text-explanation"
                class="bg-gray-50 border-x-0 border-gray-300 h-12 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-12 py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="1" value="${item.qty}" required />
              <button type="button" onclick="incrementItem('${pvk}')"
                class="cursor-pointer bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg px-3 h-12 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none">
                <svg class="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16"/>
                </svg>
              </button>
            </div>
          </div>
          ${cartCount > 1 ? 
          `<div onclick="clearItem('${pvk}')" class="hidden sm:flex flex-col items-starts h-60">
            <button class="text-gray-500 dark:text-gray-400 hover:text-red-500 text-xl cursor-pointer">&times;</button>
          </div>` : ''}
        `;

        cartItems.appendChild(itemDiv);

        total += item.price[currency] * item.qty;
      }

      document.getElementById('cartTotal').textContent = formatCurrency(total);
      document.getElementById('emptyCart').classList.add('hidden');
      cartForm.classList.remove('hidden');
    } else {
      cartForm.classList.add('hidden');
      document.getElementById('emptyCart').classList.remove('hidden');
    }
  }
}

function displayCartTotal() {
  const total = Object.values(cart).reduce((t, item) => t + item.price[currency] * item.qty, 0);
  document.getElementById('cartTotal').textContent = formatCurrency(total);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(locale, {style: 'currency', currency}).format(amount);
}

document.addEventListener('DOMContentLoaded', initCart);

const countryLocale = {
  AU: 'en-AU', AT: 'de-AT', BE: 'nl-BE', BG: 'bg-BG', CA: 'en-CA', HR: 'hr-HR',
  CY: 'el-CY', CZ: 'cs-CZ', DK: 'da-DK', EE: 'et-EE', FI: 'fi-FI', FR: 'fr-FR',
  DE: 'de-DE', GR: 'el-GR', HK: 'zh-HK', HU: 'hu-HU', IE: 'en-IE', IL: 'he-IL',
  IT: 'it-IT', JP: 'ja-JP', LV: 'lv-LV', LT: 'lt-LT', LU: 'lb-LU', MY: 'ms-MY',
  MT: 'mt-MT', NL: 'nl-NL', NZ: 'en-NZ', NO: 'no-NO', PL: 'pl-PL', PT: 'pt-PT',
  RO: 'ro-RO', SG: 'en-SG', SK: 'sk-SK', SI: 'sl-SI', KR: 'ko-KR', ES: 'es-ES',
  SE: 'sv-SE', CH: 'de-CH', AE: 'ar-AE', GB: 'en-GB', US: 'en-US'
};

const countryCurrency = {
  AU: 'AUD', AT: 'EUR', BE: 'EUR', BG: 'BGN', CA: 'CAD', HR: 'EUR', CY: 'EUR',
  CZ: 'CZK', DK: 'DKK', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR',
  HK: 'HKD', HU: 'HUF', IE: 'EUR', IL: 'ILS', IT: 'EUR', JP: 'JPY', LV: 'EUR',
  LT: 'EUR', LU: 'EUR', MY: 'MYR', MT: 'EUR', NL: 'EUR', NZ: 'NZD', NO: 'NOK',
  PL: 'PLN', PT: 'EUR', RO: 'RON', SG: 'SGD', SK: 'EUR', SI: 'EUR', KR: 'KRW',
  ES: 'EUR', SE: 'SEK', CH: 'CHF', AE: 'AED', GB: 'GBP', US: 'USD'
};

function selectCountry(code) {
  country = code;
  locale = countryLocale[code];
  const countrySelectors = document.getElementsByClassName('countrySelect');
  for (const countrySelect of countrySelectors) {
    countrySelect.value = code;
  }
  displayCart();
  saveCountry();
  updateAllProductsPrices();
}

const countryCodes = new Set(['AU', 'AT', 'BE', 'BG', 'CA', 'HR', 'CY', 'CZ', 'DK',
  'EE', 'FI', 'FR', 'DE', 'GR', 'HK', 'HU', 'IE', 'IL', 'IT', 'JP', 'LV', 'LT',
  'LU', 'MY', 'MT', 'NL', 'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'KR',
  'ES', 'SE', 'CH', 'AE', 'GB', 'US']);

function getCountryCode() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const code = locale.split('-').pop();
  if (countryCodes.has(code)) {
    return code;
  } else {
    return defaultCountry;
  }
}

function saveCountry() {
  localStorage.setItem('country', JSON.stringify(country));
}

function selectCurrency(curr) {
  currency = curr;
  const currencySelectors = document.getElementsByClassName('currencySelect');
  for (const currencySelect of currencySelectors) {
    currencySelect.value = curr;
  }
  displayCart();
  saveCurrency();
  updateAllProductsPrices();
}

function updateAllProductsPrices() {
  const priceElems = document.getElementsByClassName('productPrice');
  for (const priceElem of priceElems) {
    const pk = priceElem.getAttribute('data-pk');
    priceElem.textContent = formatCurrency(getProductPrice(pk));
  }

  const oldPriceElems = document.getElementsByClassName('productOldPrice');
  for (const oldPriceElem of oldPriceElems) {
    const pk = oldPriceElem.getAttribute('data-pk');
    oldPriceElem.textContent = formatCurrency(getProductOldPrice(pk));
  }
}

function updateProductPrice(pk) {
  const priceElems = document.querySelectorAll(`.productPrice[data-pk="${pk}"]`);
  for (const priceElem of priceElems) {
    priceElem.textContent = formatCurrency(getProductPrice(pk));
  }

  const oldPriceElems = document.querySelectorAll(`.productOldPrice[data-pk="${pk}"]`);
  for (const oldPriceElem of oldPriceElems) {
    oldPriceElem.textContent = formatCurrency(getProductOldPrice(pk));
  }
}

const elements = document.querySelectorAll('.your-class-name[data-your-data-attribute="your-data-value"]');

function getProductPrice(pk) {
  return products[pk].isSizeBasedPrice ? products[pk].price[products[pk].size][currency] : products[pk].price[currency];
}

function getProductOldPrice(pk) {
  return getProductPrice(pk) * 2;
}

function getCurrencyFromLocale() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const code = locale.split('-').pop();
  if (countryCodes.has(code)) {
    const currency = countryCurrency[code];
    if (Array.from(document.querySelectorAll('select.currencySelect option')).some(option => option.value === currency)) {
      return currency;
    }
  }
  return defaultCurrency;
}

function saveCurrency() {
  localStorage.setItem('currency', JSON.stringify(currency));
}

function checkout() {
  try {
    const lineItems = [];
    for (const pvk in cart) {
      const item = cart[pvk];
      const stripePrices = getStripePrices(item.stripePrices);
      lineItems.push({price: stripePrices[currency], quantity: item.qty});
    }

    redirectToStripeCheckout(lineItems);

  } catch (error) {
    showError(error.message);
  }
}

function redirectToStripeCheckout(lineItems) {
  const pubKey = document.querySelector("meta[name='sfkey']").content;
  const stripe = Stripe(pubKey);

  const allowedCountries = Array.from(document.querySelectorAll('select.countrySelect option')).map(opt => opt.value);

  stripe.redirectToCheckout({
    lineItems,
    mode: 'payment',
    successUrl: `${window.location.origin}/success.html?hsh=5HkxGr80yCFm&t=${Date.now() + 90000000}`,
    cancelUrl: window.location.origin,
    shippingAddressCollection: {allowedCountries}
  }).then(function (result) {
    if (result.error) {
      showError(result.error.message);
    }
  });
}

function showError(errorMessage) {
  const errorsDiv = document.getElementById('errorsSection');
  const errorBox = document.createElement('div');
  errorBox.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
  errorBox.setAttribute('role', 'alert');
  errorBox.innerHTML = `
    <strong class="font-bold">Error occurred!</strong>
    <span class="block sm:inline">${errorMessage || 'Unknown error.'}</span>
    <span class="block sm:inline">Please try again later.</span>
    <span class="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer">
      <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <title>Close</title>
        <path
          d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
      </svg>
    </span>`;
  errorBox.querySelector('span:last-child').onclick = () => errorBox.remove();
  errorsDiv.appendChild(errorBox);
  setTimeout(() => { errorBox.remove(); }, 15000);
}

function getStripePrices(str) {
  const dk = document.querySelector("meta[name='dk']").content;
  return JSON.parse(str.match(/.{1,2}/g).map((hex, i) => {
    return String.fromCharCode(parseInt(hex, 16) ^ dk.charCodeAt(i % dk.length));
  }).join(''));
}

function urgencyMessage() {
  const messages = [
    "Limited stock! 🔥 Don’t miss out — this item is selling fast.",
    "Selling quickly! 🚀 Make it yours before it’s gone.",
    "Almost gone! ⏳ Order now while supplies last.",
    "Hot item! 🔥 Others are adding this to their carts right now.",
    "Popular pick! 💥 Secure yours before it's out of stock.",
    "Don’t wait! ⏰ High demand and limited availability.",
    "Going fast! ⚡ This deal won’t last long.",
    "Act fast! 🛍️ Inventory is running low.",
    "Grab it now! 🎯 Before someone else does.",
    "Last chance! ⏳ This product won’t stay on the shelf."
  ];

  const urgencyElems = document.getElementsByClassName('urgencyMsg');
  for (const urgencyElem of urgencyElems) {
    const index = Math.floor(Math.random() * messages.length);
    urgencyElem.textContent = messages[index];
  }
}
