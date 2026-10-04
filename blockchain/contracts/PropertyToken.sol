// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PropertyToken is ERC1155, Ownable, ReentrancyGuard {
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_SHARES = 1000 * PRECISION;

    struct PropertyShare {
        uint256 propertyId;
        uint256 totalShareCount;
        uint256 sharesForSale;
        uint256 pricePerShare;
        bool isActive;
        address propertyOwner;
        uint256 createdAt;
    }

    mapping(uint256 => PropertyShare) public properties;
    uint256[] public propertyIdList;

    event SharesMinted(uint256 indexed propertyId, uint256 totalShares, uint256 pricePerShare);
    event SharesPurchased(uint256 indexed propertyId, address buyer, uint256 amount, uint256 cost);
    event SharesPriceUpdated(uint256 indexed propertyId, uint256 newPrice);
    event RentalDistributed(uint256 indexed propertyId, uint256 amountPerShare);
    event SharesDeactivated(uint256 indexed propertyId);

    constructor() ERC1155("https://platform.kigali-re.com/tokens/{id}") Ownable(msg.sender) {}

    function mintShares(
        uint256 propertyId,
        uint256 shareCount,
        uint256 pricePerShare
    ) external {
        require(shareCount > 0 && shareCount <= MAX_SHARES, "Invalid share amount");
        require(pricePerShare > 0, "Price must be > 0");
        require(properties[propertyId].propertyOwner == address(0), "Already exists");

        properties[propertyId] = PropertyShare({
            propertyId: propertyId,
            totalShareCount: shareCount,
            sharesForSale: shareCount,
            pricePerShare: pricePerShare,
            isActive: true,
            propertyOwner: msg.sender,
            createdAt: block.timestamp
        });
        propertyIdList.push(propertyId);

        _mint(msg.sender, propertyId, shareCount, "");
        emit SharesMinted(propertyId, shareCount, pricePerShare);
    }

    function buyShares(uint256 propertyId, uint256 amount) external payable nonReentrant {
        PropertyShare storage prop = properties[propertyId];
        require(prop.isActive, "Not active");
        require(amount > 0 && amount <= prop.sharesForSale, "Insufficient shares");
        uint256 cost = amount * prop.pricePerShare / PRECISION;
        require(msg.value >= cost, "Insufficient payment");

        prop.sharesForSale -= amount;
        _safeTransferFrom(prop.propertyOwner, msg.sender, propertyId, amount, "");

        (bool sent,) = payable(prop.propertyOwner).call{value: cost}("");
        require(sent, "Payment failed");

        if (msg.value > cost) {
            (bool refund,) = payable(msg.sender).call{value: msg.value - cost}("");
            require(refund, "Refund failed");
        }

        emit SharesPurchased(propertyId, msg.sender, amount, cost);
    }

    function updatePrice(uint256 propertyId, uint256 newPrice) external {
        require(properties[propertyId].propertyOwner == msg.sender, "Not owner");
        require(newPrice > 0, "Price must be > 0");
        properties[propertyId].pricePerShare = newPrice;
        emit SharesPriceUpdated(propertyId, newPrice);
    }

    function distributeRental(
        uint256 propertyId,
        uint256 totalAmount
    ) external payable nonReentrant {
        require(msg.value >= totalAmount, "Insufficient payment");
        uint256 totalSupply = totalShareCount(propertyId);
        require(totalSupply > 0, "No shares");
        uint256 perShare = totalAmount * PRECISION / totalSupply;

        emit RentalDistributed(propertyId, perShare);
    }

    function claimRentalShare(uint256 propertyId) external {
        uint256 balance = balanceOf(msg.sender, propertyId);
        require(balance > 0, "No shares");
        uint256 perShare = 0;
        (bool sent,) = payable(msg.sender).call{value: perShare * balance / PRECISION}("");
        require(sent, "Transfer failed");
    }

    function deactivateProperty(uint256 propertyId) external {
        require(properties[propertyId].propertyOwner == msg.sender || msg.sender == owner(), "Not authorized");
        properties[propertyId].isActive = false;
        emit SharesDeactivated(propertyId);
    }

    function totalShareCount(uint256 propertyId) public view returns (uint256) {
        return properties[propertyId].totalShareCount;
    }

    function getPropertyCount() external view returns (uint256) {
        return propertyIdList.length;
    }

    function getPropertyIds() external view returns (uint256[] memory) {
        return propertyIdList;
    }
}
