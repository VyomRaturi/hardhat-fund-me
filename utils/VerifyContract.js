const { run } = require("hardhat")

const verifyContract = async (address, args) => {
  try {
    console.log("Verifying Contract.....")
    await run("verify:verify", {
      address: address,
      constructorArguments: args
    })
  }
  catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!")
    }
    else {
      console.log(err)
    }
  }
}

module.exports = { verifyContract }