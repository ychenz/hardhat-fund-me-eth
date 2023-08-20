import { ethers } from "hardhat";
import { FundMe } from "../typechain-types";

async function main() {
    const [deployer] = await ethers.getSigners();
    const fundMe: FundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdraw funds back from: ", await fundMe.getAddress());

    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("Got it back!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
