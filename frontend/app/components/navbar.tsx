'use client'

import React, { useEffect, useState } from 'react'
import { useConnectWallet, useSetChain } from '@web3-onboard/react';

function Navbar() {
    const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
    const [{ chains, connectedChain }, setChain] = useSetChain();
    const [connectButtonTxt, setConnectButtonTxt] = useState<React.JSX.Element>(<span>Connect</span>);

    useEffect(() => {
        if (!connectedChain) return;

        chains.forEach((chain) => {
            if (connectedChain.id == chain.id) return;
        })

        setChain({chainId: chains[0].id});

      }, [connectedChain])


    useEffect(() => {
        if (connecting) {
            setConnectButtonTxt(<span>Connecting</span>);
        } else if (wallet) {
            const currAddress = wallet.accounts[0].address;

            setConnectButtonTxt(
                <>
                    <span>Disconnect</span>
                    <span className='text-[10px] opacity-50'>
                        {currAddress.slice(0, 6)}...{currAddress.slice(currAddress.length-4)}
                    </span>
                </>
                
            );
        } else {
            setConnectButtonTxt(<span>Connect</span>);
        }
    }, [connecting, wallet])

    return (
        <header className='h-fit p-2 bg-gray-300 text-black'>
            <div className=''>
                <button className='p-1 rounded-md border border-black hover:bg-black hover:text-white' disabled={connecting}
                    onClick={() => (wallet ? disconnect(wallet) : connect())}
                    title={wallet? wallet.accounts[0].address:""}
                >
                    <div className='flex flex-col justify-center h-full'>
                        {connectButtonTxt}
                    </div>
                </button>
            </div>
        </header>
    )
}

export default Navbar