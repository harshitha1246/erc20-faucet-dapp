const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const NAME = "FaucetToken";
  const SYMBOL = "FAUCET";
  const MAX_SUPPLY = hre.ethers.parseUnits("1000000", 18);

  const Token = await hre.ethers.getContractFactory("FaucetToken");
  const token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY, deployer.address);
  await token.waitForDeployment();

  const Faucet = await hre.ethers.getContractFactory("TokenFaucet");
  const faucet = await Faucet.deploy(await token.getAddress());
  await faucet.waitForDeployment();

  const tx = await token.setMinter(await faucet.getAddress());
  await tx.wait();

  const addresses = {
    token: await token.getAddress(),
    faucet: await faucet.getAddress()
  };

  console.log("Token:", addresses.token);
  console.log("Faucet:", addresses.faucet);

  const outPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));

  if (process.env.ETHERSCAN_API_KEY) {
    await hre.run("verify:verify", {
      address: addresses.token,
      constructorArguments: [NAME, SYMBOL, MAX_SUPPLY, deployer.address]
    });

    await hre.run("verify:verify", {
      address: addresses.faucet,
      constructorArguments: [addresses.token]
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
