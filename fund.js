const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const tx = await deployer.sendTransaction({
    to: "0xf0a675a7c5bf990a3147e0d1736a056acfdf15a3",
    value: hre.ethers.parseEther("100")
  });
  await tx.wait();
  console.log("Sent 100 ETH to your account!");
}

main();
