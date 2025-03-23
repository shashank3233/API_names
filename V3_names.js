const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://35.200.185.69:8000/v3/autocomplete';
const MAX_RESULTS = 15;
const RATE_LIMIT_DELAY = 800;
const RETRY_DELAY = 15000;
const CHARSET = ' +-.0123456789abcdefghijklmnopqrstuvwxyz';

const allNames = new Set();
const visitedPrefixes = new Set();
let totalRequests = 0;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getNextPrefix(prefix, lastName) {
  return lastName.slice(0, prefix.length + 1);
}

function incrementLastChar(prefix) {
  if (!prefix) return '';
  let chars = prefix.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    let index = CHARSET.indexOf(chars[i]);
    if (index < CHARSET.length - 1) {
      chars[i] = CHARSET[index + 1];
      return chars.slice(0, i + 1).join('');
    }
    i--;
  }
  return null; // Reached end of charset
}

function isRepeatedChar(prefix) {
  return prefix.length > 1 && prefix.split('').every(char => char === prefix[0]);
}

async function fetchNames(prefix) {
  if (visitedPrefixes.has(prefix)) return;
  visitedPrefixes.add(prefix);

  await delay(RATE_LIMIT_DELAY);

  try {
    const response = await axios.get(BASE_URL, {
      params: { query: prefix },
      timeout: 5000,
    });

    totalRequests++;
    const names = response.data?.results || [];
    let newCount = 0;
    names.forEach(name => {
      if (!allNames.has(name)) {
        allNames.add(name);
        newCount++;
      }
    });

    console.log(`[${prefix}] Fetched ${names.length} names | New: ${newCount} | Total Names: ${allNames.size} | Requests: ${totalRequests}`);

    if (names.length === MAX_RESULTS && !isRepeatedChar(prefix)) {
      const lastName = names[names.length - 1];
      const nextPrefix = getNextPrefix(prefix, lastName);
      await fetchNames(nextPrefix);
    }

    const nextSibling = incrementLastChar(prefix);
    if (nextSibling) {
      await fetchNames(nextSibling);
    }

  } catch (error) {
    console.error(`⚠️ Error on prefix "${prefix}" - ${error.message} | Retrying in ${RETRY_DELAY / 1000}s...`);
    await delay(RETRY_DELAY);
    await fetchNames(prefix); // Retry same prefix
  }
}

(async () => {
  await fetchNames(' '); // Start from space
  const outputPath = path.join(__dirname, 'name3.txt');
  fs.writeFileSync(outputPath, Array.from(allNames).sort().join('\n'), 'utf8');
  console.log(`✅ Extraction Completed. Total unique names: ${allNames.size}`);
})();
