const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  try {
    const res = await axios.get('https://www.lawmaking.go.kr/api/apiGuideInfo?type=5-1', { httpsAgent: agent });
    const html = res.data;
    const matches = html.match(/https?:\/\/[^\s"'<]+/g);
    const apiUrls = [...new Set(matches)].filter(m => m.includes('rest'));
    console.log(apiUrls);
  } catch (e) {
    console.error(e.message);
  }
}

run();
