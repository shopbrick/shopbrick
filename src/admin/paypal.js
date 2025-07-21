import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs/promises';
import cfg from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3003;

const CLIENT_ID = cfg.paypalClientID;
const CLIENT_SECRET = cfg.paypalClientSecret;
const PAYPAL_API = cfg.paypalAPI;
const SHIPPED_FILE = path.join(__dirname, 'shipped-orders.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const json = await res.json();
  return json.access_token;
}

async function getOrder(orderId, token) {
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: {Authorization: `Bearer ${token}`}
  });
  return await res.json();
}

async function getCapture(captureId, token) {
  const res = await fetch(`${PAYPAL_API}/v2/payments/captures/${captureId}`, {
    headers: {Authorization: `Bearer ${token}`}
  });
  return await res.json();
}

async function getShippedSet() {
  try {
    const raw = await fs.readFile(SHIPPED_FILE, 'utf8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

async function saveShippedSet(set) {
  await fs.writeFile(SHIPPED_FILE, JSON.stringify([...set]), 'utf8');
}

app.get('/', async (_req, res) => {
  try {
    const token = await getAccessToken();
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 30 * 864e5).toISOString();
    const txRes = await fetch(`${PAYPAL_API}/v1/reporting/transactions?start_date=${start}&end_date=${end}&fields=all&page_size=10`, {
      headers: {Authorization: `Bearer ${token}`}
    });
    const txData = await txRes.json();
    const txs = txData.transaction_details || [];

    const shipped = await getShippedSet();

    const orders = (
      await Promise.all(txs.map(async (tx) => {
        const capId = tx.transaction_info.transaction_id;
        if (tx.transaction_info.transaction_status !== 'S') return null;

        const cap = await getCapture(capId, token);
        const orderId = cap.supplementary_data?.related_ids?.order_id;
        if (!orderId) return null;

        const order = await getOrder(orderId, token);
        const payer = order?.payer?.payer_name
          ? `${order.payer.payer_name.given_name} ${order.payer.payer_name.surname}`
          : tx.payer_info?.payer_name?.alternate_full_name || 'Unknown';

        const addr = order?.purchase_units?.[0]?.shipping?.address || {};

        return {
          captureId: capId,
          orderId,
          status: tx.transaction_info.transaction_status,
          time: tx.transaction_info.transaction_initiation_date,
          amount: tx.transaction_info.transaction_amount,
          payer,
          shipping: addr,
          items: order?.purchase_units?.[0]?.items || [],
          shipped: shipped.has(orderId)
        };
      }))
    ).filter(Boolean).sort((a, b) => new Date(b.time) - new Date(a.time));

    res.render('index', {orders});
  } catch (e) {
    console.error(e);
    res.status(500).send('Fetch error');
  }
});

app.post('/mark-shipped/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const shipped = await getShippedSet();
  shipped.add(orderId);
  await saveShippedSet(shipped);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
