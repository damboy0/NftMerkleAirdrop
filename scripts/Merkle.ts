import keccak256 = require("keccak256");
import { MerkleTree } from "merkletreejs";
import fs from "fs";
import csv from "csv-parser";

export async function generateMerkleTree(filePath: string) {
  const recipients: string[] = [];
  const amounts: string[] = [];

  return new Promise<{ root: string; proofs: any[] }>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        recipients.push(row.address);
        amounts.push(row.amount);
      })
      .on("end", () => {
        // console.log("Recipients:", recipients);
        // console.log("Amounts:", amounts);

        const leaves = recipients.map((recipient, index) =>
          keccak256(recipient + amounts[index])
        );

        // console.log("Leaves:", leaves);

        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = tree.getHexRoot();

        // console.log("Merkle Root:", root);

        const proofs = recipients.map((recipient, index) => ({
          address: recipient,
          amount: amounts[index],
          proof: tree.getHexProof(leaves[index]),
        }));

       

        resolve({ root, proofs });
      })
      .on("error", reject);
  });
}
