const { ethers, network } = require("hardhat")
const { localNetwork } = require("../helper-hardhat-config.js")

const DECIMALS = 8
const INITIAL_ANSWER = 185162000000

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  if (localNetwork.includes(network.name)) {
    await deploy("MockV3Aggregator", {
      from: deployer,
      args: [DECIMALS, INITIAL_ANSWER],
      log: true
    })
  }
}

module.exports.tags = ["all", "mocks"];