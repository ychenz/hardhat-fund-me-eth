import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";
import { networkConfig, devChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const func: DeployFunction = async function ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let ethUsdPriceFeedAddress;

    if (devChains.includes(network.name)) {
        // If we are on a local dev chain, we want to use mock price feed contract
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress =
            networkConfig[network.name].ethUsdPriceFeedAddress;
    }

    // What happens when we want to change chains? (Chainlink)
    // When going for localhost or hardhat network we want to use a mock

    // If the contract doesn't exist, we deploy a minimal version of
    // for our local testing
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args, // priceFeed address
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args);
    }
    log("------------------------------------------------------------------");
};

export default func;
func.tags = ["all", "fundme"];
