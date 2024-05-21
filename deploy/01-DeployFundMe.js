const { ethers, network } = require("hardhat")
const { networkConfig, localNetwork } = require("../helper-hardhat-config.js")
const { verifyContract } = require("../utils/VerifyContract.js")
require("dotenv").config()

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  let priceFeedsAddr
  const minFundAmt = networkConfig[chainId].minFundAmt

  if (localNetwork.includes(network.name)) {
    const priceFeeds = await deployments.get("MockV3Aggregator")
    priceFeedsAddr = priceFeeds.address
  }
  else {
    priceFeedsAddr = networkConfig[chainId].priceFeeds
  }

  const args = [priceFeedsAddr]

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  })

  if (!localNetwork.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verifyContract(fundMe.address, args)
  }
}

module.exports.tags = ["all", "fundme"]