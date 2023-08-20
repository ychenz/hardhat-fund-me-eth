import { deployments, ethers, network } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";

import { devChains } from "../../helper-hardhat-config";

// Unit test only run on local javascript VM
!devChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe;
          let mockV3Aggregator: MockV3Aggregator;
          let deployer: SignerWithAddress;
          let attacker: SignerWithAddress;
          const sendValue = ethers.parseEther("1");

          beforeEach(async () => {
              // Getting the list of account for a network defined in hardhat.config.ts
              // Test should run on hardhat network, or testnet with AT LEAST 2 ACCOUNTs
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              attacker = accounts[1];

              // deploy fundme contract with hardhat deploy
              // deployments.fixture([LIST_OF_TAGS]) allows us to run all scripts in the deploy folder
              const deployment = await deployments.fixture(["all"]);
              const MockV3AggregatorAddress =
                  deployment["MockV3Aggregator"].address;
              const fundMeAddress = deployment["FundMe"].address;

              mockV3Aggregator = (await ethers.getContractAt(
                  "MockV3Aggregator",
                  MockV3AggregatorAddress,
                  deployer,
              )) as unknown as MockV3Aggregator;
              fundMe = (await ethers.getContractAt(
                  "FundMe",
                  fundMeAddress,
                  deployer,
              )) as unknown as FundMe;
          });

          describe("constructor", async () => {
              it("Should set the aggregator address correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, await mockV3Aggregator.getAddress());
              });
          });

          describe("fund", async () => {
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWithCustomError(
                      fundMe,
                      "FundMe__NotEnoughFunding",
                  );
              });

              it("Updated the amount funded data structure", async () => {
                  // Though fund doesn't take any arguments, we can pass in an options objects contains transaction data
                  // Note we are sending 1 eth as deployer
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer.address,
                  );
                  assert.equal(response, sendValue);
              });

              it("Adds funder to array of founders", async () => {
                  await fundMe.fund({ value: sendValue });
                  // Calling getFunders array at index 0
                  const firstFunder = await fundMe.getFunders(0);
                  assert.equal(firstFunder, deployer.address);
              });
          });

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
              });

              it("Should fail to withdraw if you are not the owner", async () => {
                  const fundMeContractNonDeployer = fundMe.connect(attacker);
                  await expect(
                      fundMeContractNonDeployer.withdraw(),
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("Should withdraw ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      );
                  const ownerStartBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  // Act
                  const txResponse = await fundMe.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, gasPrice } = txReceipt!;

                  // Must consider gas cost
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  );
                  const ownerEndBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  //Assert
                  assert.equal(endingFundMeBalance, 0n);
                  assert.equal(
                      startingFundMeBalance + ownerStartBalance - gasCost,
                      ownerEndBalance,
                  );
              });

              it("Cheaper withdraw - Should withdraw ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      );
                  const ownerStartBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  // Act
                  const txResponse = await fundMe.cheaperWithdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, gasPrice } = txReceipt!;

                  // Must consider gas cost
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  );
                  const ownerEndBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  //Assert
                  assert.equal(endingFundMeBalance, 0n);
                  assert.equal(
                      startingFundMeBalance + ownerStartBalance - gasCost,
                      ownerEndBalance,
                  );
              });

              it("Should allow withdraw ETH from multiple funders", async () => {
                  const accounts = await ethers.getSigners();
                  // 6 getFunders funds the contract together, excluding deployer at index 0
                  const funders = accounts.slice(1, 7);
                  for (const account of funders) {
                      // NOTE: forEach doesn't work with async funcs!!
                      const connectedContract = await fundMe.connect(account);
                      await connectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      );
                  const ownerStartBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  // Act
                  const txResponse = await fundMe.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, gasPrice } = txReceipt!;

                  // Must consider gas cost
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  );
                  const ownerEndBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  //Assert
                  assert.equal(endingFundMeBalance, 0n);
                  assert.equal(
                      startingFundMeBalance + ownerStartBalance - gasCost,
                      ownerEndBalance,
                  );

                  // Making sure all getFunders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted;
                  for (const account of funders) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              account.address,
                          ),
                          0n,
                      );
                  }
              });

              it("Cheaper withdraw - Should allow withdraw ETH from multiple funders", async () => {
                  const accounts = await ethers.getSigners();
                  // 6 funders funds the contract together, excluding deployer at index 0
                  const funders = accounts.slice(1, 7);
                  for (const account of funders) {
                      // NOTE: forEach doesn't work with async funcs!!
                      const connectedContract = await fundMe.connect(account);
                      await connectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress(),
                      );
                  const ownerStartBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  // Act
                  const txResponse = await fundMe.cheaperWithdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, gasPrice } = txReceipt!;

                  // Must consider gas cost
                  const gasCost = gasUsed * gasPrice;

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      await fundMe.getAddress(),
                  );
                  const ownerEndBalance = await ethers.provider.getBalance(
                      deployer.address,
                  );

                  //Assert
                  assert.equal(endingFundMeBalance, 0n);
                  assert.equal(
                      startingFundMeBalance + ownerStartBalance - gasCost,
                      ownerEndBalance,
                  );

                  // Making sure all funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted;
                  for (const account of funders) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              account.address,
                          ),
                          0n,
                      );
                  }
              });
          });
      });
