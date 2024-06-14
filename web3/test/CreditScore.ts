import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import hre from 'hardhat';

import { ICreditScore } from '../typechain-types/contracts/CreditScore';
import { FunctionsRouter } from '../typechain-types';

const {
  getContractAt,
  getContractFactory,
  getSigners,
  parseEther,
  getImpersonatedSigner,
  provider,
  Wallet,
} = hre.ethers;

const chainlinkRouterAddress = '0xb83E47C2bC239B3bf370bc41e1459A34b41238D0';

async function createChainlinkSubscription(consumerAddress: string) {
  // LINK token contract
  const linkTokenAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789';
  const linkTokenHolderAddress = '0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99';
  const linkTokenHolder = await getImpersonatedSigner(linkTokenHolderAddress);
  const chainlinkTokenContract = await getContractAt(
    ['function transferAndCall(address to, uint256 value, bytes data)'],
    linkTokenAddress,
  );
  const chainlinkToken = chainlinkTokenContract as any;

  // create subscription
  const chainlinkRouterContract = await getContractAt(
    '@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsRouter.sol:FunctionsRouter',
    chainlinkRouterAddress,
  );
  const chainlinkRouter = chainlinkRouterContract as unknown as FunctionsRouter;
  await chainlinkRouter.createSubscriptionWithConsumer(consumerAddress);
  const subscriptionId = await chainlinkRouter.getSubscriptionCount();

  // fund subscription
  const encodedSubscriptionId = new hre.ethers.AbiCoder().encode(
    ['uint256'],
    [subscriptionId],
  );
  await chainlinkToken
    .connect(linkTokenHolder)
    .transferAndCall(
      chainlinkRouterAddress,
      parseEther('1000'),
      encodedSubscriptionId,
    );

  return subscriptionId;
}

describe('CreditScore', () => {
  async function deployCreditScoreFixture() {
    const [owner] = await getSigners();
    const otherAccount = Wallet.createRandom().connect(provider);
    const layer2DApp = Wallet.createRandom().connect(provider);
    const chainlinkDonId =
      '0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000';
    const chainlinkGasLimit = 300000;
    const inputBoxAddress = '0x55490aA3E9b056C3330CC6AB12b0183C6854c3Db';

    const CreditScore = await getContractFactory('CreditScore');
    // sut = system under test
    const sut = await CreditScore.deploy(
      chainlinkDonId,
      chainlinkRouterAddress,
      chainlinkGasLimit,
      inputBoxAddress,
    );
    await sut.waitForDeployment();

    const [, , chainlinkSubscriptionId] = await Promise.all([
      sut.setLayer2DAppAddress(layer2DApp.address),
      owner.sendTransaction({
        to: layer2DApp.address,
        value: parseEther('10'),
      }),
      createChainlinkSubscription(sut.target.toString()),
    ]);

    await sut.setChainlinkParams(
      chainlinkDonId,
      chainlinkSubscriptionId,
      chainlinkGasLimit,
    );

    return { sut, owner, layer2DApp, otherAccount };
  }

  describe('Deployment', () => {
    it('should deploy correctly', async () => {
      const { sut } = await loadFixture(deployCreditScoreFixture);

      expect(sut.target).to.not.be.undefined;
    });
  });

  describe('Request Credit Score', () => {
    it('should request the credit score', async () => {
      const { sut } = await loadFixture(deployCreditScoreFixture);
      const mockedCreditScoreInput: ICreditScore.CreditScoreInputStruct = {
        taxId: '123456789',
        loanAmount: 1000,
      };
      const requestSource = `console.log('dapp')`;
      await sut.setRequestSource(requestSource);

      const txPromise = sut.requestCreditScore(mockedCreditScoreInput);

      const blockTimestamp = await time.latest();
      await expect(txPromise)
        .to.emit(sut, 'CreditScoreRequested')
        .withArgs(
          mockedCreditScoreInput.taxId,
          mockedCreditScoreInput.loanAmount,
          anyValue,
          blockTimestamp + 1,
        );
    });
  });

  describe('Store Credit Score', () => {
    it('should revert if the sender is not the Layer2DApp', async () => {
      const { sut, otherAccount } = await loadFixture(deployCreditScoreFixture);
      const mockedCreditScoreOutput: ICreditScore.CreditScoreOutputStruct = {
        taxId: '123456789',
        loanAmount: 1000,
        score: 700,
        qualified: true,
        sources: ['serasa', 'spc'],
        timestamp: 1620000000,
      };

      const txPromise = sut
        .connect(otherAccount)
        .storeCreditScore(mockedCreditScoreOutput);

      await expect(txPromise).to.be.revertedWithCustomError(
        sut,
        'UpdateUnauthorizedError',
      );
    });

    it('should store the credit score', async () => {
      const { sut, layer2DApp } = await loadFixture(deployCreditScoreFixture);
      const taxId = '123456789';
      const mockedCreditScoreOutput: ICreditScore.CreditScoreOutputStruct = {
        taxId,
        loanAmount: 1000,
        score: 700,
        qualified: true,
        sources: ['serasa', 'spc'],
        timestamp: 1620000000,
      };

      const txPromise = sut
        .connect(layer2DApp)
        .storeCreditScore(mockedCreditScoreOutput);

      await expect(txPromise)
        .to.emit(sut, 'CreditScoreStored')
        .withArgs(
          mockedCreditScoreOutput.taxId,
          mockedCreditScoreOutput.score,
          mockedCreditScoreOutput.qualified,
          mockedCreditScoreOutput.timestamp,
        );
      expect(await sut.getLastCreditScore(taxId)).to.deep.eq(
        Object.values(mockedCreditScoreOutput),
      );
    });
  });
});
