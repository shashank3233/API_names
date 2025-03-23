const axios = require('axios');

const BASE_URL = 'http://35.200.185.69:8000/v1/autocomplete?query=a';
const TOTAL_REQUESTS = 200;

let successCount = 0;
let firstRequestTime = null;
let lastRequestTime = null;

async function sendRequest(index) {
  try {
    if (!firstRequestTime) firstRequestTime = Date.now();

    const response = await axios.get(BASE_URL);
    console.log(`Request #${index}: ${response.status}`);
    successCount++;
    lastRequestTime = Date.now();
    return true; // continue
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log(`Request #${index}: RATE LIMITED (429)`);
      return false; // stop on 429
    } else {
      console.log(`Request #${index}: FAILED - ${error.message}`);
      return true; // continue on non-429 failure
    }
  }
}

async function runSequentialRequests() {
  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const shouldContinue = await sendRequest(i);
    if (!shouldContinue) break;
  }

  const timeTakenMs = (lastRequestTime - firstRequestTime);
  const timeTakenMinutes = timeTakenMs / 60000;

  console.log(`✅ Successful Requests: ${successCount}`);
  console.log(`📈 Effective Request Rate: ${successCount} requests per minute`);
}

runSequentialRequests();
