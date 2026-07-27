import {inactiveOldStripePrices} from '../src/stripe.js';

const envRaw = process.env.ENV;
if (!envRaw) throw new Error('ENV variable is not set. Please set it to "test" or "production" (aliases: "prod", "live").');

// Usage:
//     ENV=test npm run stripe:inactive-old-prices
//     ENV=prod npm run stripe:inactive-old-prices
//
await inactiveOldStripePrices();
