const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const csv = require('csv-parser');

const recipients = [];
const amounts = [];

// Load the CSV
fs.createReadStream('file/airdrop.csv')
  .pipe(csv())
  .on('data', (row) => {
    recipients.push(row.address);
    amounts.push(row.amount);
  })
  .on('end', () => {
    // Build the Merkle Tree
    const leaves = recipients.map((recipient, index) => 
      keccak256(recipient + amounts[index])
    );
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    
    const root = tree.getHexRoot();
    console.log("Merkle Root:", root);

    // Save root and proofs to file
    const proofs = recipients.map((recipient, index) => ({
      address: recipient,
      amount: amounts[index],
      proof: tree.getHexProof(leaves[index]),
    }));

    fs.writeFileSync('merkleData.json', JSON.stringify({ root, proofs }, null, 2));
  });
