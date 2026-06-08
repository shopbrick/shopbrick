# ShopBrick 🧱🛒

**ShopBrick** is a static e-commerce framework — deploy anywhere with zero backend infrastructure.
Receive your orders directly via **Stripe** or **PayPal**, and manage everything locally with version-controlled product data.

![ShopBrick's Mascot - Brick](https://raw.githubusercontent.com/shopbrick/shopbrick/refs/heads/main/doc/img/brick-mascot.png "ShopBrick's Mascot - Brick")

---

## 🚀 Quick Start (5 minutes)

```sh
git clone git@github.com:shopbrick/shopbrick.git my-shop
cd my-shop
npm install
npm run init
npm run dev
```

Open: http://localhost:3000

---

## 🚀 Quick Start (5 minutes)

```sh
git clone git@github.com:shopbrick/shopbrick.git my-shop
cd my-shop
npm install
npm run init
npm run dev
```

Open: http://localhost:3000

---

## 🚀 Features

* 🛠️ Static site generation — deploy to GitHub Pages, Netlify, or any static host
* 💳 Stripe & PayPal integration
* 📁 Product data stored in the file system
* 🔣 YAML-based content
* 🌍 Currency conversion with ExchangeRate API
* ⚙️ Configurable shop name, theme, supported currencies & countries
* 🛒 Shopping cart functionality built into the frontend
* 🧾 Built-in admin panel (local) for PayPal order management
* 📝 Blog support (text + inline images)
* 📤 Build static version and deploy to GitHub Pages or Netlify with ease

<details>
  <summary>Product Page Example</summary>
  <p>
    <img src="https://raw.githubusercontent.com/shopbrick/shopbrick/main/doc/img/product_page.webp" alt="Product Page Example" />
  </p>
</details>

---

## 🚀 Create Your Shop

You can create your own ShopBrick-based store in two ways.

### ⭐ Option 1 — Use GitHub Template (Recommended)

1. Click **"Use this template"** on GitHub
2. Create a new repository (**can be private**)
3. Clone your repo:

```sh
git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

### 🛠️ Option 2 — Manual Setup

```sh
git clone git@github.com:shopbrick/shopbrick.git my-shop
cd my-shop

rm -rf .git

git init
git remote add origin git@github.com:YOUR_USERNAME/my-shop.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

### 🔄 (Optional) Get Updates from ShopBrick

```sh
git remote add upstream git@github.com:shopbrick/shopbrick.git
git fetch upstream
git merge upstream/main
```

> 💡 Advanced users can use `git rebase upstream/main` for a cleaner history.

---

## ⚙️ Dependencies

* Node.js
* TailwindCSS (via CLI)

---

## 🔌 Integrations

* Stripe
* PayPal
* ExchangeRate API

---

## 📦 Installation

```sh
npm install
```

---

## 🧱 Init Project

```sh
npm run init
```

---

## 🧪 Start Development Server

```sh
npm run dev
```

Tailwind watcher:

```sh
npx @tailwindcss/cli -i ./views/css/styles.css -o ./public/css/styles.css -m -w
```

---

## ⚙️ Configure Your Shop

Edit `config/config.yml`:

* Shop name and domain
* Supported currencies and countries
* Theme colors

Update images:

* `public/img/hero.webp`
* `public/img/about.webp`

Other config files are in `.gitignore` - Do NOT push them to public repos. Even better, do NOT push to any repos at all:

* `config/secrets.yml` - loaded in all environments
* `config/test.yml` - loaded in test environment
* `config/production.yml` - loaded for production/live environment

You can pass custom configs:

```sh
CONFIG=theme/green.yml ENV=test npm run dev
```
```sh
CONFIG=theme/orange.yml ENV=test npm run dev
```

---

## 📁 Product Data Structure

```sh
/products
├── /<product-handle>
│   ├── info.yml
│   ├── description.txt
│   ├── /images/
│   └── /images/description/
```

---

## ➕ Add a Product

```sh
npm run add-product foldable-cat-hammock
```

---

## 📝 Add a Blog Post

Add `.txt` files to `/blogs` and images to `/public/img/blog`.

---

## 💱 Exchange Rate API

Add into `config/secrets.yml` (loaded in both `test` and `production` environments)

```yml
exchangerateApiKey: 'YOUR-KEY'
```

```sh
npm run get-rates
npm run convert-prices
```

---

## 💳 Stripe Integration

Add into `config/test.yml`

```yml
stripeApiPublishableKey: 'pk_test_...'
stripeApiSecretKey: 'sk_test_...'
```

```sh
ENV=test npm run stripe
```

and `config/production.yml`

```yml
stripeApiPublishableKey: 'pk_live_...'
stripeApiSecretKey: 'sk_live_...'
```

```sh
ENV=prod npm run sync-stripe
```

---

## 💰 PayPal Integration

Add into `config/test.yml` and `config/production.yml`

```yml
paypalClientID: '...'
paypalClientSecret: '...'
```

---

## 🏗️ Build Static Site

```sh
ENV=prod npm run build
```

Preview:

```sh
cd build
caddy file-server --browse --listen :9000
```

---

## 🚀 Deploy

### GitHub Pages

* Push `/build` to repo

### Netlify

* Build: `npm run build`
* Publish: `build`

---

## 📦 Orders

Stripe → dashboard
PayPal → local admin panel:

```sh
npm run admin
```

---

## 📈 Google Analytics

Add script to `header.ejs`

---

## 🧾 Handy Aliases

```sh
alias nrd="npm run dev"
alias build="npm run build"
```

---

## ❤️ Like ShopBrick?

Star it, use it, or build something awesome with it.
