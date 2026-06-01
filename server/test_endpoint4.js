const axios = require('axios');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

const serviceKey = 'a1cf006c849d7889470de18f832a593b1335c2880857ccec6051c05281eac2a7';
const encodedKey = encodeURIComponent(serviceKey);

async function testApi(url) {
  try {
    const res = await axios.get(url, { httpsAgent: agent });
    console.log(`URL: ${url}`);
    console.log(res.data.substring(0, 500));
  } catch(e) {
    console.log(`Failed for ${url}: ${e.message}`);
  }
}

const urls = [
  // 1. 행정예고
  `http://apis.data.go.kr/1130000/MoflegAdofNotcService/getMoflegAdofNotcList?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&notcNm=${encodeURIComponent('안전검사')}`,
  // 2. 입법예고
  `http://apis.data.go.kr/1130000/MoflegLgslatNotcService/getMoflegLgslatNotcList?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&notcNm=${encodeURIComponent('산업안전보건법')}`,
  // 3. lawmaking
  `https://www.lawmaking.go.kr/api/ptcpAdmPpList?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&searchKeyword=${encodeURIComponent('안전검사')}`
];

urls.forEach(testApi);
