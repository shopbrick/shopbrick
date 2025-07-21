import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import {format} from 'date-fns';

async function fetchExchangeRates(apiKey, baseCurrency) {
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  const fileName = `${dateStr}-${baseCurrency}.json`;
  const filePath = path.join(process.cwd(), 'src', 'exchrates', fileName);

  if (fs.existsSync(filePath)) {
    console.log(`Using exchange rates from existing file: ${filePath}`)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.conversion_rates;
  }

  try {
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.result === 'success') {
      const output = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, output);
      console.log(`Exchange rates have been saved to ${filePath}`);
      return data.conversion_rates;
    } else {
      console.error('Failed to fetch exchange rates:', data['error-type']);
      return;
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
  }
}

export default fetchExchangeRates;
