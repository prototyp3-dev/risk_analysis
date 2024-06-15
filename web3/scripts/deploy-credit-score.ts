import hre from 'hardhat';

const { getContractFactory } = hre.ethers;

interface CreditScoreArgs {
  chainlinkDonId: string;
  chainlinkGasLimit: number;
  chainlinkRouterAddress: string;
  inputBoxAddress: string;
}

interface CreditScoreNetworkArgs {
  sepolia: CreditScoreArgs;
}

const creditScoreArgs: CreditScoreNetworkArgs = {
  sepolia: {
    chainlinkDonId:
      '0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000',
    chainlinkGasLimit: 300000,
    chainlinkRouterAddress: '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0',
    inputBoxAddress: '0x59b22D57D4f067708AB0c00552767405926dc768',
  },
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const address = await deploy();
  await delay(2000);
  await verifyContract(address);
}

function getParams(network: string): [string, number, string, string] {
  const networkArgs = creditScoreArgs[network as keyof CreditScoreNetworkArgs];

  if (!networkArgs) {
    throw new Error(`Constructor arguments not found for network ${network}`);
  }

  return [
    networkArgs.chainlinkDonId,
    networkArgs.chainlinkGasLimit,
    networkArgs.chainlinkRouterAddress,
    networkArgs.inputBoxAddress,
  ];
}

async function deploy() {
  const network = hre.network.name as keyof CreditScoreNetworkArgs;

  console.log(`Deploying contract to ${network}...`);

  const constructorArgs = getParams(network);
  const creditScoreFactory = await getContractFactory('CreditScore');
  const creditScore = await creditScoreFactory.deploy(...constructorArgs);
  await creditScore.waitForDeployment();

  console.log(`CreditScore address on ${network}: ${creditScore.target}`);

  return creditScore.target.toString();
}

async function verifyContract(address: string) {
  const network = hre.network.name as keyof CreditScoreNetworkArgs;
  const constructorArguments = getParams(network);

  console.log(`Verifying in ${network}...`);

  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
      force: true,
    });

    console.log(`Contract verified: ${address}`);
  } catch (error) {
    console.error('Error verifying CreditScore:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
