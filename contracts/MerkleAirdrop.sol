// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop is Ownable(msg.sender) {
    IERC20 public token;
    bytes32 public merkleRoot;
    address public constant BAYC_ADDRESS = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D; 

    mapping(address => bool) public claimed;

    event AirdropClaimed(address indexed user, uint256 amount);

    constructor(address _token, bytes32 _merkleRoot) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
    }

    modifier onlyBAYCHolder() {
        require(IERC721(BAYC_ADDRESS).balanceOf(msg.sender) > 0, "You do not own a BAYC NFT.");
        _;
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external onlyBAYCHolder {
        require(!claimed[msg.sender], "Airdrop already claimed.");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount)); // Verify using merkleproof
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid Merkle Proof.");

        claimed[msg.sender] = true;

        require(token.transfer(msg.sender, amount), "Token transfer failed.");

        emit AirdropClaimed(msg.sender, amount);
    }


     function checkContractBalance() external view onlyOwner returns (uint256) {
        return token.balanceOf(address(this));
    }
}
