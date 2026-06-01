const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  try {
    const res = await axios.get('https://www.data.go.kr/tcs/dss/selectDataSetList.do?dType=API&keyword=' + encodeURIComponent('법제처 행정예고'), { httpsAgent: agent });
    const html = res.data;
    const matches = [...new Set(html.match(/\/data\/[0-9]+\/openapi\.do/g))];
    
    for (const match of matches) {
      try {
        const detailRes = await axios.get('https://www.data.go.kr' + match, { httpsAgent: agent });
        const urlMatch = detailRes.data.match(/http:\/\/apis\.data\.go\.kr\/[^<"'\s]+/);
        if (urlMatch) {
          console.log(`Found in ${match}:`, urlMatch[0]);
        }
      } catch (e) {
        console.log(`Failed ${match}`);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

run();
