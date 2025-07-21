# ShopBrick

**ShopBrick** is a static e-commerce framework — deploy anywhere with zero backend infrastructure.  
Receive your orders directly via **Stripe** or **PayPal**, and manage everything locally with version-controlled product data.

---

## 🚀 Features

- 🛠️ Static site generation — deploy to GitHub Pages, Netlify, or any static host  
<details>
  <summary>Product Page Example</summary>
  ![Product Page Example](/shopbrick/shopbrick/doc/img/product_page.webp "Product Page Example")
</details>
- 💳 Stripe & PayPal integration  
- 📁 Product data stored in the file system
- 🔣 YAML-based content
- 🌍 Currency conversion with ExchangeRate API  
- ⚙️ Configurable shop name, theme, supported currencies & countries  
- 🛒 Shopping cart functionality built into the frontend  
- 🧾 Built-in admin panel (local) for PayPal order management  
- 📝 Blog support (text + inline images)

---

## ⚙️ Dependencies

- Node.js
- TailwindCSS (via CLI)

---

## 🔌 Integrations

- [Stripe](https://stripe.com)
- [PayPal](https://paypal.com)
- [ExchangeRate API](https://exchangerate.host/)

---

## 📦 Installation

```sh
npm install
```

---

## 🧱 Init Project

Run the following command to generate example products and create the secrets file:

```sh
npm run init
```

Which is equivalent to:

```sh
node scripts/init.js
```

---

## 🧪 Start Development Server

```sh
npm run dev
```

To watch and rebuild TailwindCSS styles during development:

```sh
npx @tailwindcss/cli -i ./views/css/styles.css -o ./public/css/styles.css -m -w
```

<details>
  <summary>Check different theme configs (click to expand)</summary>

Green theme:
```sh
CONFIG=green nrd
```

Orange theme:
```sh
CONFIG=orange nrd
```
</details>

---

## ⚙️ Configure Your Shop

Edit `config/config.yml` to:

- Set shop name and domain
- Choose supported currencies and countries
- Customize theme colors using TailwindCSS classes

Replace hero images in:
- `public/img/hero.webp`
- `public/img/about.webp`

---

## 📁 Product Data Structure

```sh
/data
├── /<product-handle>
│   ├── info.yml
│   ├── description.txt
│   ├── /images/main
│   └── /images/description
```

---

## ➕ Add a Product

To create a new product directory, e.g. for `foldable-cat-hammock`:

```sh
node scripts/add_product.js foldable-cat-hammock
```

Then:
- Edit `info.yml` to set price, variants, stock
- Add description in `description.txt`
- Add images to:
  - `/images/main/` for carousel
  - `/images/description/` for inline visuals
- Optionally, use `description.html` instead of `.txt` for full control

---

## 📝 Add a Blog Post

1. Add a new `.txt` file to the `/blogs` directory (e.g. `4.txt`)
2. To insert an image, place it into `public/img/blog/` (e.g. `4.jpg`)
3. In your blog text, use `/img/blog/4.jpg` to embed the image

<details>
  <summary>Blog post example (click to expand)</summary>

**File**: `./blogs/4.txt`

```txt
Creating a Space That Reflects You
January 9, 2024

Your living space isn’t just where you eat and sleep — it’s where your personality lives...
...
/img/blog/4.jpg
```
</details>

---

## 💱 Exchange Rate API

Register at [exchangerateapi.com](https://exchangerateapi.com) and update your API key in:

`config/secrets.yml`:

```yml
exchangerateApiKey: 'YOUR-EXCHANGE-RATE-API-KEY'
```

Fetch today's rates:

```sh
npm run rates
```

Update product prices using exchange rates:

```sh
npm run prices
```

---

## 💳 Stripe Integration

Register at [stripe.com](https://stripe.com) and place your keys in `config/secrets.yml`:

```yml
stripeApiSecretKey: 'sk_test_YOUR_SECRET_KEY'
stripeApiPublishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY'
```

Export products into your Stripe catalog:

```sh
npm run stripe
```

After testing, update with your live keys.  
You can configure your checkout page colors in the Stripe dashboard.

---

## 💰 PayPal Integration

Register at [paypal.com](https://paypal.com) and insert your credentials into `config/secrets.yml`:

```yml
paypalClientID: 'YOUR_PAYPAL_CLIENT_ID'
paypalClientSecret: 'YOUR_PAYPAL_CLIENT_SECRET'
paypalAPI: 'https://api-m.sandbox.paypal.com' # Use production URL for live
```

---

## 🏗️ Build Static Site

Create a production-ready static site:

```sh
npm run build
```

To preview locally (with [Caddy](https://caddyserver.com)):

```sh
cd build
caddy file-server --browse --listen :9000
```

Visit: [http://localhost:9000](http://localhost:9000)

---

## 🚀 Deploy to GitHub Pages

1. Create repo: `yourcompany.github.io`
2. Commit & push your `/build` directory
3. In GitHub settings, set the branch to deploy from `/build`
4. Configure custom domain in DNS (optional)

---

## 🚀 Deploy to Netlify

1. Connect your repo in [Netlify](https://netlify.com)
2. Set build command to:
   ```sh
   npm run build
   ```
3. Set publish directory to:
   ```sh
   build
   ```
4. Configure environment variables in Netlify UI (Stripe, PayPal, etc.)

---

## 📦 Manage Stripe Orders

Go to [stripe.com](https://stripe.com) → Payments → Orders  
ShopBrick saves:
- Selected product variants (as line items)
- Customer name, address, email

You can mark orders as fulfilled by prepending `[FULFILLED]` to the order name.

---

## 📦 Manage PayPal Orders

PayPal transactions may not include full product/item info.  
Use the **local admin panel** to view and manage orders:

```sh
npm run admin
```

This fetches orders and product line items from PayPal API and shows them in a dashboard.

![Local admin panel to see PayPal orders](/shopbrick/shopbrick/doc/img/admin_paypal_orders.webp "Local admin panel to see PayPal orders")

---

## 📈 Integrate Google Analytics

<details>
  <summary>Instructions (click to expand)</summary>

1. Open `views/templates/header.ejs`
2. Paste the GA snippet before `</head>`

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=REPLACE_WITH_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'REPLACE_WITH_ID');
</script>
```
</details>

---

## 🧾 Handy Aliases

Add these to your shell profile (e.g. `.zshrc`, `.bashrc`) for quick usage:

```sh
alias nrd="npm run dev"
alias tw="npx @tailwindcss/cli -i ./views/css/styles.css -o ./public/css/styles.css -m -w"
alias rates="npm run rates"
alias prices="npm run prices"
alias stripe="npm run stripe"
alias build="npm run build"
```

---

### ❤️ Like ShopBrick?

Star it on GitHub, share it with others, or fork it for your own use!
