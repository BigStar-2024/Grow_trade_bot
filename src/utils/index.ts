import { BIRDEYE_API_URL, REQUEST_HEADER } from "../config";
import redisClient from "../services/redis";

export function isValidWalletAddress(address: string): boolean {
  if (!address) return false;
  const pattern: RegExp = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  return pattern.test(address);
}

export const generateReferralCode = (length: number) => {
  let code = '';
  // Convert the Telegram username to a hexadecimal string
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function formatNumber(number: bigint | string | number) {
  if (!number) return "0";
  // Convert the number to a string and add commas using regular expression
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatKMB(val: bigint | string | number) {
  if (!val) return "0";
  if (Number(val) > 1000000000) {
    return `${(Number(val) / 1000000000).toFixed(1)}B`;
  }
  if (Number(val) > 1000000) {
    return `${(Number(val) / 1000000).toFixed(1)}M`;
  }
  if (Number(val) > 1000) {
    return `${(Number(val) / 1000).toFixed(1)}k`;
  }
  return Number(val).toFixed(3);
}

export const contractLink = (mint: string) => {
  return `<a href="https://solscan.io/token/${mint}">Contract</a>`;
}

export const birdeyeLink = (mint: string) => {
  return `<a href="https://birdeye.so/token/${mint}?chain=solana">Birdeye</a>`;
}

export const dextoolLink = (mint: string) => {
  return `<a href="https://www.dextools.io/app/en/solana/pair-explorer/${mint}">Dextools</a>`;
}

export const dexscreenerLink = (mint: string) => {
  return `<a href="https://dexscreener.com/solana/${mint}">Dexscreener</a>`;
}

export function formatPrice(price: number) {
  if (!price) return 0;
  if (price <= 0) return 0;
  // If the price is less than 1, format it to 6 decimal places
  if (price < 1) {
    let decimal = 15;
    while (1) {
      if (price * 10 ** decimal < 1) {
        break;
      }
      decimal--;
    }
    return price.toFixed(decimal + 3);
  }
  // If the price is greater than or equal to 1, format it to 3 decimal places
  return price.toFixed(2);
}

export const getPrice = async (mint: string) => {
  const key = `${mint}_price`;
  const data = await redisClient.get(key);
  if (data) {
    return Number(data);
  }
  const options = { method: 'GET', headers: REQUEST_HEADER };
  const response = await fetch(`https://public-api.birdeye.so/defi/price?address=${mint}`, options)
  const res = await response.json();
  const price = res.data.value;
  await redisClient.set(key, price);
  await redisClient.expire(key, 5); // 5 seconds
  return Number(price);
};

export const copytoclipboard = (
  text: string
) => {
  return `<code class="text-entity-code clickable" role="textbox" tabindex="0" data-entity-type="MessageEntityCode">${text}</code>`;
}

export const isEqual = (a: number, b: number) => {
  return Math.abs(b - a) < 0.001;
}

export const fromWeiToValue = (wei: string | number, decimal: number) => {
  return Number(wei) / 10 ** decimal;
}