import { expect } from "chai";
import { BytesLike } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import path from "path";
import { generateMerkleTree } from "../scripts/Merkle";

describe("MerkleAirdrop", function () {

  async function deployToken() {
    const [owner, claimer1] = await ethers.getSigners();
   
    
    const Damboy = await ethers.getContractFactory("Damboy");
    const damboyToken = await Damboy.connect(owner).deploy();

    return { damboyToken, owner, claimer1 };
  }

  async function deployMerkleAirdrop() {
    const { damboyToken, owner, claimer1 } = await loadFixture(deployToken);

    
    const { root, proofs } = await generateMerkleTree(path.join(__dirname, "../file/airdrop.csv"));

   
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

    //   it("Should deploy the MerkleAirdrop contract with correct Merkle root", async function () {
    //     const { merkleAirdrop, proofs } = await loadFixture(deployMerkleAirdrop);
  
    //     const rootFromContract = await merkleAirdrop.merkleRoot();
    //     console.log("Root from contract:", rootFromContract);
    //     console.log("Expected root:", proofs[0]?.root);
  
    //     expect(rootFromContract).to.equal(proofs[0]?.root); // Ensure the correct Merkle root is set
    //   });
  });


  describe("Claim", function () {
    it("Should allow the claimer to claim airdrop using a valid Merkle proof", async function () {
      const { damboyToken, merkleAirdrop, owner, claimer1, proofs } =
        await loadFixture(deployMerkleAirdrop);

      // Get proof for claimer1 from the generated Merkle tree data
      const claimerProof = proofs.find((proof: any) => proof.address === claimer1.address);

      // Fund the airdrop contract with tokens
      const AirdropPool = ethers.parseUnits("10000", 18);
      await damboyToken.connect(owner).transfer(merkleAirdrop.getAddress(), AirdropPool);

      const claimedAmt = ethers.parseUnits(claimerProof.amount, 18);

      // Claim tokens
      await merkleAirdrop.connect(claimer1).claim(claimedAmt, claimerProof.proof);

      // Verify the claimer's balance after the claim
      expect(await damboyToken.balanceOf(claimer1.address)).to.equal(claimedAmt);
    });

    it("Should reject a claim with an invalid Merkle proof", async function () {
      const { merkleAirdrop, claimer1 } = await loadFixture(deployMerkleAirdrop);

      // Try to claim with an invalid proof
      const invalidProof: BytesLike[] = [];

      await expect(merkleAirdrop.connect(claimer1).claim(ethers.parseUnits("100", 18), invalidProof))
        .to.be.revertedWith("Invalid Merkle Proof.");
    });
  });
});
