
# Stripe Integration Guide for ShopBrick 🧱🛒

This guide helps you configure and work with Stripe in your ShopBrick-powered storefront.

## 🧾 Purpose

ShopBrick uses Stripe to handle secure payment processing. Product data is exported into Stripe via API, and customer orders are recorded there directly — no backend required.

---

## 🚀 Get Started

### 📘 Stripe Docs:  
- [Stripe Checkout (Client-Side)](https://docs.stripe.com/payments/checkout/client)  
- [Stripe Dev Environment (Node.js)](https://docs.stripe.com/get-started/development-environment?lang=node)  
- [Retrieve Price API](https://docs.stripe.com/api/prices/retrieve)  
- [Update Price API](https://docs.stripe.com/api/prices/update)

---

## 🔑 API Keys

- Get your **test keys** and **production keys** here:  
  [Stripe Test API Keys](https://dashboard.stripe.com/test/apikeys)

### Add them to your `config/secrets.yml`:

```yml
stripeApiSecretKey: 'sk_test_YOUR_SECRET_KEY'
stripeApiPublishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY'
```

🧪 Use test keys during development and testing.  
🟢 Switch to live keys only when ready for production (can comment test keys, add prod keys, restart the server if needed).

---

## 🛍️ Stripe Dashboard (Test Mode)

- [Test Dashboard Overview](https://dashboard.stripe.com/test/dashboard)  
- [Test Payments View](https://dashboard.stripe.com/test/payments)  
- [Test Settings](https://dashboard.stripe.com/test/settings)

---

## 🎨 Customize Checkout Colors and Appearance

You can style your Stripe-hosted checkout pages to match your ShopBrick theme.

- [Brand Settings](https://dashboard.stripe.com/settings/branding)  
- [Checkout Appearance Settings](https://dashboard.stripe.com/settings/branding/checkout)

Make sure to match colors, logo, and accent styles to your config.

---

## 🧪 Testing Payments

- [Stripe Testing Docs](https://docs.stripe.com/testing?locale=en-GB)  
- Use test card numbers and simulate various scenarios (e.g. 3D Secure, failed payments, etc.)

---

## Stripe Domain Registration

Stripe Checkout requires your production domain to be registered.

If payment link does not work and you see (in the browser dev console):

"The domain (https://yourdomain.com/) that redirected to Checkout is not enabled
in the dashboard. Add this domain at https://dashboard.stripe.com/account/checkout/settings."

open:

https://dashboard.stripe.com/settings/checkout

and add your domain into CLIENT-ONLY INTEGRATION section.

---

## 🛠 Development Tips

- Use `npm run stripe` to export your local ShopBrick products into Stripe.
- When testing, you can preview product data in Stripe’s **Product** and **Pricing** sections.
- Use the **Name** field in the Stripe product to match your ShopBrick product title and variants.

---

💡 For more details on Stripe integration logic, refer to `src/stripe.js` in your codebase.
