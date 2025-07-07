// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AINFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("AI NFT", "AINFT") Ownable(msg.sender) {}

    function mintNFT(address to, string memory tokenURI) public {
        _safeMint(to, nextTokenId);
        _setTokenURI(nextTokenId, tokenURI);
        nextTokenId++;
    }
}
