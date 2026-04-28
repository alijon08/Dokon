// src/api.js
// Google Apps Script URL'ni shu yerga yozing
const API_URL = import.meta.env.VITE_API_URL || 'YOUR_APPS_SCRIPT_URL';

async function call(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function getAllData() {
  try {
    return await call({ action: 'getAll' });
  } catch {
    // Offline bo'lsa localStorage dan olamiz
    return {
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      finance: JSON.parse(localStorage.getItem('finance') || '[]'),
    };
  }
}

export async function saveProducts(data) {
  localStorage.setItem('products', JSON.stringify(data)); // offline backup
  return call({ action: 'saveProducts', data: JSON.stringify(data) });
}

export async function saveTransactions(data) {
  localStorage.setItem('transactions', JSON.stringify(data));
  return call({ action: 'saveTransactions', data: JSON.stringify(data) });
}

export async function saveFinance(data) {
  localStorage.setItem('finance', JSON.stringify(data));
  return call({ action: 'saveFinance', data: JSON.stringify(data) });
}
