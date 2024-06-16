'use client'

import React, { useEffect, useState } from 'react'
import { useConnectWallet, useSetChain } from '@web3-onboard/react';
import creditScoreABI from "@/public/CreditScore_abi.json";
import { Contract, ContractTransaction, ethers } from 'ethers';
import { envClient } from './utils/envClient';
import { InputBox__factory } from '@cartesi/rollups';
import { getInputResult } from "cartesi-client"


interface Score {
  taxId:string,
  loanAmount:number,
  score:number
}

export default function Home() {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain }, setChain] = useSetChain();

  const [taxId, setTaxId] = useState("");
  const [loanAmount, setLoanAmount] = useState<bigint>(BigInt(0));
  const [waiting, setWaiting] = useState(false);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Array<Score>>([]);

  useEffect(() => {
    if (!connectedChain) return;

    chains.forEach((chain) => {
        if (connectedChain.id == chain.id) return;
    })

    setChain({chainId: chains[0].id});

  }, [connectedChain])

  const handletaxIdChange = (event:React.FormEvent<HTMLInputElement>) => {
    setTaxId(event.currentTarget.value);
  }

  const handleLoanAmountChange = (event:React.FormEvent<HTMLInputElement>) => {
    setLoanAmount(BigInt(event.currentTarget.value));
  }

  async function request_score() {
    setWaiting(true);
    setStep(0);

    const signer = new ethers.providers.Web3Provider(wallet!.provider, 'any').getSigner();
    const credit_score_contract = new Contract(envClient.CREDIT_SCORE_ADDR, creditScoreABI, signer);

    try {
      const tx = await credit_score_contract.requestCreditScore({"taxId": taxId, "loanAmount": loanAmount});
      await watch_steps(tx, signer);
    } catch (error) {
      console.log((error as Error).message);
      setWaiting(false);
    }

  }


  async function watch_steps(tx:ContractTransaction, signer: ethers.providers.JsonRpcSigner) {
    const receipt = await tx.wait();
    console.log(receipt)

    if (!receipt.events) {
      throw new Error("No events found");
    }

    for (let i = 0; i < receipt.events.length; i++) {
      const event = receipt.events[i];
      if (event.event === "CreditScoreRequested") {
        setStep(1);
      }
      break;
    }

    const input_contract = InputBox__factory.connect("0x59b22d57d4f067708ab0c00552767405926dc768", signer);
    let inputIndex:number;
    input_contract.on("InputAdded", async (dapp, dappInputIndex, sender, input) => {
      console.log(dapp, dappInputIndex, sender, input);

      if (dapp.toLowerCase() == envClient.DAPP_ADDR.toLowerCase()) {
        setStep(2);
        inputIndex = Number(dappInputIndex._hex);

        const res = await getInputResult({cartesiNodeUrl: envClient.CARTESI_NODE_URL, inputIndex: inputIndex, initialDelay: 2000, delayInterval: 500, outputIndex: 0})

        const payload_utf8 = ethers.utils.toUtf8String(res.notices[0].payload);
        const payload_json = JSON.parse(payload_utf8);

        setScores([...scores, {taxId: payload_json.taxId, loanAmount: payload_json.loanAmount, score: payload_json.score}]);
        setStep(3);
        setWaiting(false);
      }
    })
  }

  if (!wallet) {
    return (
      <main>
          <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline' disabled={connecting}
              onClick={() => (wallet ? disconnect(wallet) : connect())}
          >
              <div className='flex flex-col justify-center h-full'>
                  Connect
              </div>
          </button>
      </main>
    )
  }


  return (
    <main>
      <form className="content">
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxId">
            Tax Id
          </label>
          <input
            onChange={handletaxIdChange}
            maxLength={14}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="taxId" type="text"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loanAmount">
            Loan Amount
          </label>
          <input
            onChange={handleLoanAmountChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="loanAmount" type="number"
          />
        </div>
        
        <div className="flex items-center justify-center">
          <button
          disabled={waiting}
          //disabled={step != -1}
          onClick={request_score}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
          type="button">

            {
              !waiting?
                "Request Score"
              :
                <div className='w-6 h-6 border-2 rounded-full border-current border-r-transparent animate-spin'>
                </div>
            }
            
          </button>
        </div>
      
      </form>
      

      <ol className={`flex items-center justify-center w-full max-w-2xl p-3 space-x-2 text-sm font-medium text-center text-gray-500 sm:text-base  sm:p-4 sm:space-x-4 rtl:space-x-reverse`}>
          <li className={`flex items-center ${step >= 1? "text-blue-600": ""}`}>
            <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${step >= 1? "text-blue-600": "border-gray-500"}`}>
                1
            </span>
            Score <span className="hidden sm:inline-flex sm:ms-2">Requested</span>
            <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
            </svg>
          </li>
          <li className={`flex items-center ${step >= 2? "text-blue-600": ""}`}>
            <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${step >= 2? "text-blue-600": "border-gray-500"}`}>
                2
            </span>
            Input <span className="hidden sm:inline-flex sm:ms-2">Added</span>
            <svg className="w-3 h-3 ms-2 sm:ms-4 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 12 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 9 4-4-4-4M1 9l4-4-4-4"/>
            </svg>
          </li>
          <li className={`flex items-center ${step >= 3? "text-blue-600": ""}`}>
            <span className={`flex items-center justify-center w-5 h-5 me-2 text-xs border rounded-full shrink-0 ${step >= 3? "text-blue-600": "border-gray-500"}`}>
                3
            </span>
            DApp Notice
          </li>
      </ol>

      {
        scores.length == 0?
          <></>
        :
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="text-xs uppercase ">
                      <tr>
                          <th scope="col" className="px-6 py-3">
                              Tax ID
                          </th>
                          <th scope="col" className="px-6 py-3">
                              Loan Amount
                          </th>
                          <th scope="col" className="px-6 py-3">
                              Score
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                    {
                      scores.map((score, index) => {
                        return (
                          <tr key={index} className="odd:bg-white  even:bg-gray-50  border-b">
                              <th scope="row" className="px-6 py-4 font-medium  whitespace-nowrap">
                                  {score.taxId}
                              </th>
                              <td className="px-6 py-4">
                                  {score.loanAmount}
                              </td>
                              <td className="px-6 py-4">
                                  {score.score}
                              </td>
                          </tr>
                        )
                      })
                    }
                      
                  </tbody>
              </table>
            </div>
      }



    </main>
  );
}
