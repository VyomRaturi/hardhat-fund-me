const { ethers } = require("hardhat")

const networkConfig = {
  11155111: {
    name: "sepolia",
    priceFeeds: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    // minFundAmt: ethers.parseEther("50"),    // 50 USD with 10^18 decimal places
  },
  31337: {
    // minFundAmt: ethers.parseEther("50"),
    name: "localhost",
  }
}

const localNetwork = ["hardhat", "localhost"]

module.exports = { networkConfig, localNetwork }