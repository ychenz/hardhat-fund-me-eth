// Example: https://github.com/aave/aave-v3-core/blob/master/helper-hardhat-config.ts

interface NetworkConfig {
    [name: string]: {
        ethUsdPriceFeedAddress: string;
        blockConfirmations?: number;
    };
}

export const networkConfig: NetworkConfig = {
    sepolia: {
        ethUsdPriceFeedAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        blockConfirmations: 2,
    },
    localhost: {
        ethUsdPriceFeedAddress: "",
    },
    hardhat: {
        ethUsdPriceFeedAddress: "",
    },
    // Other networks as well
    polygon: {
        ethUsdPriceFeedAddress: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
};

export const devChains = ["hardhat", "localhost"];

// Mock params for Chainlink AggregatorV3Interface
export const DECIMALS = 8;
export const INIT_ANSWER = 200000000000;
