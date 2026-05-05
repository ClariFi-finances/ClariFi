const fetch = require('node-fetch');

async function test() {
  const headers = { 'X-Cognito-Id': '33ac2a0a-5041-7006-9e3c-7e780e102f17' };
  const res = await fetch('http://localhost:5080/api/categories?userId=6', { headers });
  const text = await res.text();
  console.log('Categories:', text);
}
test();
