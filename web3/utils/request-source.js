const taxId = args[0];
const loanAmount = args[1];

const url = `https://x.kona.finance/api/credit-score?tax_id=${taxId}&loan_amount=${loanAmount}`;

const response = await Functions.makeHttpRequest({ url, timeout: 60000 });

console.log('API Response: ', response);

if (response.error) {
  console.error(response.error);
  throw Error('Request failed: ' + JSON.stringify(response));
}

return Functions.encodeString(JSON.stringify(response.data));
