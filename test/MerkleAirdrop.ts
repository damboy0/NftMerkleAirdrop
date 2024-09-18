import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

import { generateMerkleTree } from "../scripts/Merkle";
import path from "path";

describe("MerkleAirdrop", function () {
  // Fixture to deploy the token contract
  async function deployToken() {
    const owner = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621"; // Owner address
    const claimer1 = "0xF22742F06e4F6d68A8d0B49b9F270bB56affAB38"; // Claimer address

    // Impersonate the owner and claimer accounts
    await helpers.impersonateAccount(owner);
    await helpers.impersonateAccount(claimer1);
    
    const ownerSigner = await ethers.getSigner(owner);
    const claimer1Signer = await ethers.getSigner(claimer1);

    // Deploy ERC20 mock token
    const Token = await ethers.getContractFactory("ERC20Mock");
    const roccoToken = await Token.connect(ownerSigner).deploy(
      "Rocco Token",
      "ROC",
      ownerSigner.address,
      ethers.utils.parseUnits("100000", 18) // Mint 100k tokens
    );

    return { roccoToken, ownerSigner, claimer1Signer };
  }

  // Fixture to deploy the MerkleAirdrop contract
  async function deployMerkleAirdrop() {
    const { roccoToken, ownerSigner, claimer1Signer } = await loadFixture(deployToken);

    // Generate Merkle tree and proofs from the CSV
    const { root, proofs } = await generateMerkleTree(path.join(__dirname, "../file/airdrop.csv"));

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.connect(ownerSigner).deploy(
      roccoToken.address,
      root,
      "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" // BAYC address
    );

    return { roccoToken, merkleAirdrop, ownerSigner, claimer1Signer, proofs };
  }

  describe("Deployment", function () {
    it("Should set the correct owner for the token contract", async function () {
      const { roccoToken, ownerSigner } = await loadFixture(deployMerkleAirdrop);
      expect(await roccoToken.owner()).to.equal(ownerSigner.address);
    });

    it("Should deploy the MerkleAirdrop contract with correct Merkle root", async function () {
      const { merkleAirdrop, ownerSigner, proofs } = await loadFixture(deployMerkleAirdrop);

      const rootFromContract = await merkleAirdrop.merkleRoot();
      expect(rootFromContract).to.equal(proofs[0].root); // Ensure the correct Merkle root is set
    });
  });

  
});
