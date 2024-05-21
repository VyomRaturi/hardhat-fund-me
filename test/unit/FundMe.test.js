const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { localNetwork } = require("../../helper-hardhat-config")

!localNetwork.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
    let fundMe
    let mockV3Aggregator
    let deployer
    const sendValue = ethers.parseEther("1")
    beforeEach(async function () {
      deployer = (await getNamedAccounts()).deployer;
      const contracts = await deployments.fixture(["all"]);

      const signer = await ethers.getSigner(deployer);
      const fundMeAddress = contracts["FundMe"].address;
      fundMe = await ethers.getContractAt("FundMe", fundMeAddress, signer);
      mockV3Aggregator = contracts["MockV3Aggregator"];
    });

    describe("constructor", async function () {
      it("sets the aggregator addresses correctly", async () => {
        const response = await fundMe.getPriceFeed()
        assert.equal(response, mockV3Aggregator.address)
      })
    })

    describe("fund", function () {
      // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
      // could also do assert.fail
      it("Fails if you don't send enough ETH", async () => {
        await expect(fundMe.fund()).to.be.revertedWith(
          "You need to spend more ETH!"
        )
      })
      // we could be even more precise here by making sure exactly $50 works
      // but this is good enough for now
      it("Updates the amount funded data structure", async () => {
        await fundMe.fund({ value: sendValue })
        const response = await fundMe.getAddressToAmountFunded(
          deployer
        )
        assert.equal(response.toString(), sendValue.toString())
      })
      it("Adds funder to array of funders", async () => {
        await fundMe.fund({ value: sendValue })
        const response = await fundMe.getFunder(0)
        assert.equal(response, deployer)
      })
    })
    describe("withdraw", function () {
      beforeEach(async () => {
        await fundMe.fund({ value: sendValue })
      })
      it("withdraws ETH from a single funder", async () => {
        // Arrange
        const startingFundMeBalance =
          await ethers.provider.getBalance(
            fundMe.target,
          )
        const startingDeployerBalance =
          await ethers.provider.getBalance(deployer)

        // Act
        const transactionResponse = await fundMe.withdraw()
        const transactionReceipt = await transactionResponse.wait()
        const { gasUsed, gasPrice } = transactionReceipt
        const gasCost = gasUsed * gasPrice

        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        )
        const endingDeployerBalance =
          await ethers.provider.getBalance(deployer)

        // Assert
        // Maybe clean up to understand the testing
        assert.equal(endingFundMeBalance, 0)
        assert.equal(
          (startingFundMeBalance
            + startingDeployerBalance)
            .toString(),
          (endingDeployerBalance + gasCost).toString()
        )
      })
      // this test is overloaded. Ideally we'd split it into multiple tests
      // but for simplicity we left it as one
      it("is allows us to withdraw with multiple funders", async () => {
        // Arrange
        const accounts = await ethers.getSigners()
        for (i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(
            accounts[i]
          )
          await fundMeConnectedContract.fund({ value: sendValue })
        }
        const startingFundMeBalance =
          await ethers.provider.getBalance(fundMe.target)
        const startingDeployerBalance =
          await ethers.provider.getBalance(deployer)

        // Act
        const transactionResponse = await fundMe.cheaperWithdraw()
        // Let's comapre gas costs :)
        // const transactionResponse = await fundMe.withdraw()
        const transactionReceipt = await transactionResponse.wait()
        const { gasUsed, gasPrice } = transactionReceipt
        const withdrawGasCost = gasUsed * gasPrice
        console.log(`GasCost: ${withdrawGasCost}`)
        console.log(`GasUsed: ${gasUsed}`)
        console.log(`GasPrice: ${gasPrice}`)
        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        )
        const endingDeployerBalance =
          await ethers.provider.getBalance(deployer)
        // Assert
        assert.equal(
          (startingFundMeBalance
            + startingDeployerBalance)
            .toString(),
          (endingDeployerBalance + withdrawGasCost).toString()
        )
        // Make a getter for storage variables
        await expect(fundMe.getFunder(0)).to.be.reverted

        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(
              accounts[i].address
            ),
            0
          )
        }
      })
      it("Only allows the owner to withdraw", async function () {
        const accounts = await ethers.getSigners();
        const attacker = accounts[1];
        const attackerConnectedContract = await fundMe.connect(attacker);
        await expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner");
      })
    })
  })