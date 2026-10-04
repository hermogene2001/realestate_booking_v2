// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyDeedNFT
 * @dev NFT-based property ownership deeds for real estate platform
 */
contract PropertyDeedNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct PropertyDeed {
        uint256 tokenId;
        address owner;
        string propertyAddress;
        uint256 propertyId;
        uint256 area;
        bool isActive;
        uint256 createdAt;
    }

    mapping(uint256 => PropertyDeed) public propertyDeeds;
    mapping(uint256 => uint256) public propertyIdToTokenId;

    event DeedMinted(uint256 tokenId, address owner, uint256 propertyId, string propertyAddress);
    event DeedTransferred(uint256 tokenId, address from, address to, uint256 propertyId);
    event DeedRevoked(uint256 tokenId, uint256 propertyId);

    constructor() ERC721("KigaliPropertyDeed", "KPD") Ownable(msg.sender) {}

    function mintDeed(
        address to,
        uint256 propertyId,
        string memory propertyAddress,
        uint256 area
    ) external onlyOwner returns (uint256) {
        require(propertyIdToTokenId[propertyId] == 0, "Property already has a deed");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _mint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("https://platform.kigali-re.com/deeds/", _toString(tokenId))));

        propertyDeeds[tokenId] = PropertyDeed({
            tokenId: tokenId,
            owner: to,
            propertyAddress: propertyAddress,
            propertyId: propertyId,
            area: area,
            isActive: true,
            createdAt: block.timestamp
        });

        propertyIdToTokenId[propertyId] = tokenId;
        emit DeedMinted(tokenId, to, propertyId, propertyAddress);
        return tokenId;
    }

    function transferDeed(address from, address to, uint256 propertyId) external {
        uint256 tokenId = propertyIdToTokenId[propertyId];
        require(tokenId > 0, "Deed does not exist");
        require(propertyDeeds[tokenId].isActive, "Deed is not active");
        _transfer(from, to, tokenId);
        propertyDeeds[tokenId].owner = to;
        emit DeedTransferred(tokenId, from, to, propertyId);
    }

    function revokeDeed(uint256 tokenId) external onlyOwner {
        require(propertyDeeds[tokenId].isActive, "Deed already inactive");
        propertyDeeds[tokenId].isActive = false;
        emit DeedRevoked(tokenId, propertyDeeds[tokenId].propertyId);
    }

    function getDeedDetails(uint256 tokenId) external view returns (PropertyDeed memory) {
        return propertyDeeds[tokenId];
    }

    function getTokenIdByPropertyId(uint256 propertyId) external view returns (uint256) {
        return propertyIdToTokenId[propertyId];
    }

    function verifyOwnership(uint256 propertyId, address owner) external view returns (bool) {
        uint256 tokenId = propertyIdToTokenId[propertyId];
        if (tokenId == 0) return false;
        return propertyDeeds[tokenId].owner == owner && propertyDeeds[tokenId].isActive;
    }

    // OZ v5: ERC721URIStorage overrides
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
