const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);

  const Auth = await hre.ethers.getContractFactory("AuthorizationManager");
  const auth = await Auth.deploy();
  await auth.waitForDeployment();

  await auth.initialize(deployer.address);

  const Vault = await hre.ethers.getContractFactory("SecureVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  await vault.initialize(await auth.getAddress());

  console.log("AuthorizationManager:", await auth.getAddress());
  console.log("SecureVault:", await vault.getAddress());
}

main();