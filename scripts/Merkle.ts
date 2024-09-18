import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import * as fs from 'fs';
import csvParser from 'csv-parser';

interface RecipientData {
  address: string;
  amount: string;
}

interface ProofData {
  address: string;
  amount: string;
  proof: string[];
}

const recipients: string[] = [];
const amounts: string[] = [];

// Load the CSV
fs.createReadStream('file/airdrop.csv')
  .pipe(csvParser())
  .on('data', (row: RecipientData) => {
    recipients.push(row.address);
    amounts.push(row.amount);
  })
  .on('end', () => {
    // Build the Merkle Tree
    const leaves = recipients.map((recipient, index) => 
      keccak256(Buffer.from(recipient + amounts[index]))
    );
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    
    const root = tree.getHexRoot();
    console.log("Merkle Root:", root);

    // Save root and proofs to file
    const proofs: ProofData[] = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts[index],
      proof: tree.getHexProof(leaves[index]),
    }));

    fs.writeFileSync('merkleData.json', JSON.stringify({ root, proofs }, null, 2));
  });
