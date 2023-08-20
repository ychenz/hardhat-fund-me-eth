import { ethers } from "hardhat";
import { FundMe } from "../typechain-types";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Getting previously deployed contract
    const fundMe: FundMe = await ethers.getContract("FundMe", deployer);

    const transactionResponse = await fundMe.fund({
        value: ethers.parseEther("0.1"),
    });
    await transactionResponse.wait(1);
    console.log("Funded contract at: ", await fundMe.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
