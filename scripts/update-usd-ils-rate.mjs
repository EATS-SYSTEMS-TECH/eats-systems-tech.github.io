import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const destination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/data/usd-ils-rate.json');
const url = 'https://www.boi.org.il/PublicApi/GetExchangeRate?key=USD';
const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw Error(`Bank of Israel rate HTTP ${response.status}`);
const data = await response.json();
const rate = Number(data.currentExchangeRate), updated = new Date(data.lastUpdate);
if (data.key !== 'USD' || data.unit !== 1 || !Number.isFinite(rate) || rate < 1 || rate > 10 || Number.isNaN(updated.getTime())) throw Error('Invalid Bank of Israel USD/ILS rate');
if (updated.getTime() > Date.now() + 60_000 || Date.now() - updated.getTime() > 7 * 86400_000) throw Error('Bank of Israel USD/ILS rate is stale or future-dated');
const previous = await fs.readFile(destination, 'utf8').then(JSON.parse).catch(() => null);
if (previous && new Date(previous.lastUpdate).getTime() > updated.getTime()) throw Error('Bank of Israel rate moved backwards');
const record = { base: 'USD', quote: 'ILS', rate: data.currentExchangeRate, unit: 1, lastUpdate: updated.toISOString(), source: url };
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(record, null, 2)}\n`);
console.log(`${record.rate} ILS per USD at ${record.lastUpdate}`);
