import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import path from "path";
import { generateMerkleTree } from "../scripts/Merkle";

describe("MerkleAirdrop", function () {

  async function deployToken() {
    const [owner, claimer1] = await ethers.getSigners(); // Use Hardhat's default accounts

    // Deploy Damboy token
    const Damboy = await ethers.getContractFactory("Damboy");
    const damboyToken = await Damboy.connect(owner).deploy();

    return { damboyToken, owner, claimer1 };
  }

  async function deployMerkleAirdrop() {
    const { damboyToken, owner, claimer1 } = await loadFixture(deployToken);

    // Generate Merkle tree and proofs from the CSV
    const { root, proofs } = await generateMerkleTree(path.join(__dirname, "../file/airdrop.csv"));

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    const merkleAirdrop = await MerkleAirdrop.connect(owner).deploy(
      damboyToken.getAddress(),
      root
    );

    return { damboyToken, merkleAirdrop, owner, claimer1, proofs };
  }

  describe("Deployment", function () {
    it("Should set the correct owner for the token contract", async function () {
      const { damboyToken, owner } = await loadFixture(deployMerkleAirdrop);
      expect(await damboyToken.owner()).to.equal(owner.address);
    });

    it("Should deploy the MerkleAirdrop contract with correct Merkle root", async function () {
      const { merkleAirdrop, proofs } = await loadFixture(deployMerkleAirdrop);

      const rootFromContract = await merkleAirdrop.merkleRoot();
      expect(rootFromContract).to.equal(proofs[0].root); // Ensure the correct Merkle root is set
    });
  });
});
