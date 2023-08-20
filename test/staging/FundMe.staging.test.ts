import { deployments, ethers, network } from "hardhat";
import { FundMe } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert } from "chai";
import { devChains } from "../../helper-hardhat-config";

devChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe;
          let deployer: SignerWithAddress;
          const sendValue = ethers.parseEther("0.1");

          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0]; // Note: testnet only have 1 signer for now

              // We need to first deploy the contract onto the testnet for this to worl
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("Allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingFundMeBalance = await ethers.provider.getBalance(
                  await fundMe.getAddress(),
              );

              assert.equal(endingFundMeBalance, 0n);
          });
      });
