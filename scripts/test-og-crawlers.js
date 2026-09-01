const http = require('http');

async function testCrawler(ua) {
  return new Promise((resolve) => {
    const req = http.request('http://127.0.0.1:3005/invamax-workspace/o/danh-muc-hang-thang-9', {
      headers: { 'User-Agent': ua }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body
        });
      });
    });
    req.end();
  });
}

async function run() {
  const uas = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (compatible; ZaloBot/1.0; +https://zalo.me)'
  ];

  for (const ua of uas) {
    const res = await testCrawler(ua);
    console.log(`\n=== TEST CRAWLER: ${ua} ===`);
    console.log(`Status: ${res.status}`);
    const metaMatches = res.body.match(/<meta[^>]+>/gi) || [];
    const ogTags = metaMatches.filter(m => m.includes('og:') || m.includes('twitter:'));
    ogTags.forEach(t => console.log(' ', t));
  }

  // Also test direct short link /o/danh-muc-hang-thang-9
  const shortRes = await testCrawler('facebookexternalhit/1.1');
  console.log(`\n=== TEST SHORT ROUTE /o/danh-muc-hang-thang-9 ===`);
  console.log(`Status: ${shortRes.status}`);
}

run();
