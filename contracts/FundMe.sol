// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Created by Yuchen: 2023-Aug-04

// Get funds from users
// Withdraw funds
// Set a minimum funding value in USD

import "./PriceConverter.sol";

// Create cost: 859771 gas
// Create cost after change min usd to constant: 839981 gas

/**
 *  Interfaces, Libraries
 */

/**
 * Contracts
 *
 * Doc specifications: https://docs.soliditylang.org/en/latest/style-guide.html#natspec
 */

/**
 * @title A contract for crowd funding
 * @author Yuchen
 * @notice This contract is to demo a sample funding contract
 * @dev This implements Chainlink's AggregatorV3Interface to get ETH/USD price feed
 */
contract FundMe {
    /** Type declarations */
    // Attaching all functions from PriceConverter to uint256
    using PriceConverter for uint256;

    /** State variables */
    // Best practice: prepend `s_` to variables that uses storage (lots of gas!)
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    // Save gas - constant
    uint256 public constant MINIMUM_USD = 50 * 1e18;
    // Save gas - immutable
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    /** Events */

    /** Errors */
    // Errors name convention: contractName__ErrorName
    error FundMe__NotOwner();
    error FundMe__NotEnoughFunding();

    /** Modifiers */
    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not owner!");
        // Save gas - More gas efficient way of doing the above require
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }

        _; // Placeholder for the code in the function that uses this modifier
    }

    /** Functions, with order*/
    /// Constructor
    /// receive
    /// fallback
    /// external
    /// public
    /// internal
    /// private
    /// view/pure

    // priceFeed is address of a chainlink contract contains ETH/USD price feed
    constructor(address priceFeedAddress) {
        // *Right here, msg.sender referring to the smart contract creator, since the current transaction is creating the contract
        i_owner = msg.sender;

        // ChainLink ETH/USD Sepolia Address 0x694AA1769357215DE4FAC081bf1f309aDC325306
        // Details: https://docs.chain.link/data-feeds/price-feeds/addresses
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if people send fund directly to this contract without calling fund (sending directly to address), or calling a non-existing function?
    // 1. receive (still triggers if 0 eth is sent)
    // 2. Fallback: If calldata of low level transaction is not empty (same as metamask send directly to address), it's like calling a function, if function
    //   not exists, falback function will be triggered.
    receive() external payable {
        // Transfer this way cost a bit more gas
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     * @dev This uses the price feed from Chainlink to check for minimum funding value in USD
     */
    function fund() public payable {
        // Want to set min fund amount in USD
        // 1. How do we send ETH to this contract
        // Note msg.value is passed as 1st param to the library function getConversionRate(). If you pass param to a lib function, it starts from the 2nd param.
        //   msg.value is only accessible if the function is payable
        // require(
        //     msg.value.getConversionRate(s_priceFeed) > MINIMUM_USD,
        //     "Didn't send enough!"
        // ); // msg.value is in Wei unit, so need 1e18 for MINIMUM_USD

        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert FundMe__NotEnoughFunding();
        }

        // Store funders and each amount funded
        // *msg.sender here referring to whoever calls the fund() function (the funders)
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            // Reset fund amount
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset the array
        s_funders = new address[](0);

        // *3 ways to Withdraw the fund

        // 1. transfer
        // msg.sender -> address type
        // payable(msg.sender) -> payable address
        // This auto-reverts the transaction when failed
        //payable(msg.sender).transfer(address(this).balance);

        // 2. send
        // Note this won't auto-revert if failed!!
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // This reverts the transaction if failed
        //require(sendSuccess, "Send failed");

        // 3. call
        (
            bool callSuccess, // bytes memory dataReturned

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    // Note this only becomes cheaper with more funders (more array iteration), with only 1 founder this is more expensive
    // (See the "Max" column in the gas-report.txt)
    function cheaperWithdraw() public onlyOwner {
        // Mapping can't be in memory
        address[] memory funders = s_funders;

        for (
            uint funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            // Reset fund amount
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset the array
        s_funders = new address[](0);

        (
            bool callSuccess, // bytes memory dataReturned

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
