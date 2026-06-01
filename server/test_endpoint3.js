const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  try {
    const res = await axios.get('https://www.lawmaking.go.kr/api/apiGuideInfo?type=5-1', { httpsAgent: agent });
    const matches = res.data.match(/https?:\/\/[^\s"'<]+/g);
    const urls = [...new Set(matches)].filter(m => m.includes('api') || m.includes('rest'));
    console.log('lawmaking.go.kr urls:', urls);
  } catch (e) {
    console.error(e.message);
  }
}
run();
