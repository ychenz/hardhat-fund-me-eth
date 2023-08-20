// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Importing contract interface from NPM chainlink/contracts package
// Chainlink is a Oracle network that provides external data
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData(); // int = int256
        // ETH in terms of USD
        // priceFeed.decimals(); return # of decimal places (should be 8 for the price, so if 1 eth = $2000 USD, this returns 2000*1e8)
        // Since our msg.value is in WEI (1e18*ether count), we need to multiply our price by 1e(18-8) => 1e10
        return uint256(price * 1e10);
    }

    function getConversionRate(
        uint256 ethAmount, // this is passed from uint256: `using PriceConverter for uint256;`
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // ethAmount is amount of WEI, which is ETH*1E18

        uint256 ethPrice = getPrice(priceFeed); // eth price is also ETH*1E18
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd; /// Unit: $usd *1e18
    }
}
