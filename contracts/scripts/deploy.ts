// import { ethers } from "hardhat";
import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
  const factory1 = await ethers.getContractFactory("RedPacket1");
  const contract1 = await factory1.deploy();
  await contract1.waitForDeployment();
  console.log("RedEnvelope1 deployed to:", await contract1.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
