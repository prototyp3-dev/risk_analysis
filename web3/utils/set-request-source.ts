import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { JsonRpcProvider, ethers } from 'ethers';
import { abi } from '../artifacts/contracts/CreditScore.sol/CreditScore.json';

const creditScoreContract = '<CONTRACT_ADDRESS>';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const RPC_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;

async function getContract() {
  const provider = new JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(creditScoreContract, abi, signer);

  return { contract, provider };
}

async function main() {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'request-source.js'))
    .toString();

  const { contract } = await getContract();
  const tx = await contract.setRequestSource(source);
  await tx.wait();

  console.log('tx confirmed: ', tx.hash);
}

main().catch(console.error);
