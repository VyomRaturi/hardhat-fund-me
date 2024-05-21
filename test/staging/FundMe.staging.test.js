const { deployments, network, ethers } = require("hardhat");
const { localNetwork } = require("../../helper-hardhat-config");
const { assert } = require("chai");

localNetwork.includes(network.name) // only run this test nets >>sepolia
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
    let deployer;
    let fundMe;
    let fundMeAddress;
    const sendValue = ethers.parseEther("0.1");
    beforeEach(async () => {
      const accounts = await ethers.getSigners();
      deployer = accounts[0];
      const Deployments = await deployments.fixture(["all"]);
      fundMeAddress = Deployments.FundMe.address;
      fundMe = await ethers.getContractAt(
        "FundMe",
        fundMeAddress,
        deployer,
      );
      //   fundMe = await ethers.getContract("FundMe", deployer);
    });

    it("allows people to fund and withdraw", async function () {
      const fundTxResponse = await fundMe.fund({ value: sendValue });
      await fundTxResponse.wait(1);
      const withdrawTxResponse = await fundMe.withdraw();
      await withdrawTxResponse.wait(1);

      const endingFundMeBalance = await ethers.provider.getBalance(
        fundMe.target,
      );
      console.log(
        endingFundMeBalance.toString() +
        " should equal 0, running assert equal...",
      );
      assert.equal(endingFundMeBalance.toString(), "0");
    });
  });