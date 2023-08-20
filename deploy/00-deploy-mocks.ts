import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { network, ethers } from "hardhat";
import {
    networkConfig,
    devChains,
    DECIMALS,
    INIT_ANSWER,
} from "../helper-hardhat-config";

// Pre-deploy steps
const func: DeployFunction = async function ({
    deployments,
    getNamedAccounts,
}: HardhatRuntimeEnvironment) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (devChains.includes(network.name)) {
        log("Local network detected! Deploying Mocks ...");
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [
                DECIMALS, // uint8 _decimals
                INIT_ANSWER, // int256 _initialAnswer
            ],
            log: true,
        });
        log(`MockV3Aggregator Mock deployed on network '${network.name}'!`);
        log("----------------------------------------------------------------");
    }
};

export default func;
func.tags = ["all", "mocks"];
