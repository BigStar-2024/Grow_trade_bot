import redisClient from "../services/redis";

export function isValidWalletAddress(address: string): boolean {
  if (!address) return false;
  const pattern: RegExp = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  return pattern.test(address);
}

export function formatNumber(number: bigint | string | number) {
  if (!number) return "0";
  // Convert the number to a string and add commas using regular expression
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
    return price.toFixed(decimal + 2);
  }
  // If the price is greater than or equal to 1, format it to 3 decimal places
  return price.toFixed(3);
}

const options = {
  method: 'GET',
  headers: { 'x-chain': 'solana', 'X-API-KEY': 'abe5631abe864d529c0fbe4c8e905c97' }
};
export const getPrice = async (mint: string) => {
  const key = `${mint}_price`;
  const data = await redisClient.get(key);
  if (data) {
    return data;
  }
  const response = await fetch(`https://public-api.birdeye.so/public/price?address=${mint}`, options)
  const res = await response.json();
  const price = res.data.value;
  await redisClient.set(key, price);
  await redisClient.expire(key, 5); // 5 seconds
  return price;
};