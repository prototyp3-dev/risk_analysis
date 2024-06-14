import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';
import 'hardhat-dependency-compiler';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    compilers: [
      {
        version: '0.8.19',
      },
    ],
  },
  dependencyCompiler: {
    paths: [
      '@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsRouter.sol',
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
        blockNumber: 6101400,
      },
      accounts: [
        {
          privateKey: `0x${process.env.PRIVATE_KEY}`,
          balance: '100000000000000000000000',
        },
      ],
    },
  },
  etherscan: {
    apiKey: process.env.BLOCKSCAN_API_KEY,
  },
};

export default config;
