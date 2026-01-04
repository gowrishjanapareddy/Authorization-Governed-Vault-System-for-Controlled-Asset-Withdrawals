const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureVault + AuthorizationManager (System Test)", function () {
  let authManager, vault;
  let owner, recipient, attacker;

  beforeEach(async function () {
    [owner, recipient, attacker] = await ethers.getSigners();

    // Deploy AuthorizationManager
    const Auth = await ethers.getContractFactory("AuthorizationManager");
    authManager = await Auth.deploy();
    await authManager.waitForDeployment();
    await authManager.initialize(owner.address);

    // Deploy SecureVault
    const Vault = await ethers.getContractFactory("SecureVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
    await vault.initialize(await authManager.getAddress());

    // Fund the vault
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("1")
    });
  });

  it("allows withdrawal with a valid authorization", async function () {
    const amount = ethers.parseEther("0.5");
    const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-1"));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const authHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [
          await vault.getAddress(),
          recipient.address,
          amount,
          nonce,
          chainId
        ]
      )
    );

    const signature = await owner.signMessage(
      ethers.getBytes(authHash)
    );

    await expect(
      vault.withdraw(recipient.address, amount, nonce, signature)
    ).to.changeEtherBalances(
      [vault, recipient],
      [-amount, amount]
    );
  });

  it("rejects reused authorization (replay protection)", async function () {
    const amount = ethers.parseEther("0.2");
    const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-2"));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const authHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [
          await vault.getAddress(),
          recipient.address,
          amount,
          nonce,
          chainId
        ]
      )
    );

    const signature = await owner.signMessage(
      ethers.getBytes(authHash)
    );

    // First withdrawal succeeds
    await vault.withdraw(recipient.address, amount, nonce, signature);

    // Second attempt must fail
    await expect(
      vault.withdraw(recipient.address, amount, nonce, signature)
    ).to.be.revertedWith("Authorization already used");
  });

  it("rejects authorization signed by wrong signer", async function () {
    const amount = ethers.parseEther("0.1");
    const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-3"));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const authHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [
          await vault.getAddress(),
          recipient.address,
          amount,
          nonce,
          chainId
        ]
      )
    );

    // Attacker signs instead of owner
    const badSignature = await attacker.signMessage(
      ethers.getBytes(authHash)
    );

    await expect(
      vault.withdraw(recipient.address, amount, nonce, badSignature)
    ).to.be.revertedWith("Invalid signature");
  });

  it("rejects withdrawal if vault balance is insufficient", async function () {
    const amount = ethers.parseEther("2"); // more than vault has
    const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-4"));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    const authHash = ethers.keccak256(
      ethers.solidityPacked(
        ["address", "address", "uint256", "bytes32", "uint256"],
        [
          await vault.getAddress(),
          recipient.address,
          amount,
          nonce,
          chainId
        ]
      )
    );

    const signature = await owner.signMessage(
      ethers.getBytes(authHash)
    );

    await expect(
      vault.withdraw(recipient.address, amount, nonce, signature)
    ).to.be.revertedWith("Insufficient balance");
  });
});