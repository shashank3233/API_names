const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://35.200.185.69:8000/v1/autocomplete';
const MAX_RESULTS = 10;
const RATE_LIMIT_DELAY = 650;

const allNames = new Set();
const visitedPrefixes = new Set();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getNextPrefix(prefix, lastName) {
  // Get new prefix by taking first (prefix.length + 1) chars of lastName
  return lastName.slice(0, prefix.length + 1);
}

function incrementLastChar(prefix) {
  if (prefix.length === 0) return '';
  let chars = prefix.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    if (chars[i] !== 'z') {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.slice(0, i + 1).join('');
    }
    i--;
  }
  return null; // All 'z', no more combinations
}

async function fetchNames(prefix) {
  if (visitedPrefixes.has(prefix)) return;
  visitedPrefixes.add(prefix);

  await delay(RATE_LIMIT_DELAY);

  try {
    const response = await axios.get(BASE_URL, {
      params: { query: prefix },
      timeout: 5000
    });

    const names = response.data?.results || [];
    names.forEach(name => allNames.add(name));

    console.log(`[${prefix}] Fetched ${names.length} names | Total: ${allNames.size}`);

    if (names.length === MAX_RESULTS) {
      const lastName = names[names.length - 1];
      const nextPrefix = getNextPrefix(prefix, lastName);
      await fetchNames(nextPrefix);
    }

    const nextSibling = incrementLastChar(prefix);
    if (nextSibling) {
      await fetchNames(nextSibling);
    }

  } catch (error) {
    console.error(`⚠️ Error on prefix "${prefix}": ${error.message}`);
    await delay(3000);
    await fetchNames(prefix); // Retry
  }
}

// Main execution
(async () => {
  await fetchNames('a');

  const outputPath = path.join(__dirname, 'V1_name.txt');
  fs.writeFileSync(outputPath, Array.from(allNames).sort().join('\n'), 'utf8');

  console.log(`✅ Extraction Completed. Total unique names: ${allNames.size}`);
})();
