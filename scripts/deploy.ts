import { Dice__factory } from "./../typechain";
import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();
  const contract = await new Dice__factory(signers[0]).deploy();
  await contract.deployed();
  // console.log("hh run scripts/deploy.ts --network shibuya");
  console.log("deployed contract address:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
