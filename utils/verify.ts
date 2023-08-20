import { run } from "hardhat";

/**
 * Verify contract on Etherscan. Shows a green check mark and reveal the contract source code on the Etherscan.
 *
 * @param contractAddress
 * @param args
 * @returns
 */
export async function verify(contractAddress: string, args: any[]) {
    console.log("Verifying contract...");

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (error: any) {
        if (error.message.includes("already verified")) {
            console.log(error.message);
            return;
        } else {
            console.log(error);
        }
    }
}
