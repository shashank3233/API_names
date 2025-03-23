const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://35.200.185.69:8000/v2/autocomplete'; // Update if needed
const MAX_RESULTS = 12;
const RATE_LIMIT_DELAY = 1300;
const RETRY_DELAY = 15000;
const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz';

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
  return null; // End of charset
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
    names.forEach(name => allNames.add(name));

    console.log(`[${prefix}] Fetched ${names.length} names | Total Names: ${allNames.size} | Requests: ${totalRequests}`);

    // If MAX_RESULTS hit, go deeper with more specific prefix
    if (names.length === MAX_RESULTS) {
      const lastName = names[names.length - 1];
      const nextPrefix = getNextPrefix(prefix, lastName);
      await fetchNames(nextPrefix);
    }

    // Move to next sibling prefix
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
  await fetchNames('0'); // Start from lowest prefix
  const outputPath = path.join(__dirname, 'V2_name.txt');
  fs.writeFileSync(outputPath, Array.from(allNames).sort().join('\n'), 'utf8');
  console.log(`✅ Extraction Completed. Total unique names: ${allNames.size}`);
})();
