// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RealEstateEscrow
 * @notice Escrow contract for Kigali Real Estate Booking platform.
 *         Locks tenant deposits and releases funds only after both
 *         tenant and owner confirm property handover.
 */
contract RealEstateEscrow is ReentrancyGuard, Pausable {

    // ──────────────────────────────────────────────
    //  Enums & Structs
    // ──────────────────────────────────────────────

    enum BookingState {
        Created,   // 0 - Booking created, deposit made
        Locked,    // 1 - Deposit confirmed & locked
        Completed, // 2 - Funds released to owner
        Refunded,  // 3 - Funds returned to tenant
        Disputed,  // 4 - Dispute raised, awaiting admin
        Cancelled  // 5 - Booking cancelled
    }

    struct Booking {
        uint256 propertyId;
        address payable tenant;
        address payable owner;
        uint256 amount;
        BookingState state;
        bool tenantConfirmed;
        bool ownerConfirmed;
        uint256 createdAt;
        uint256 timeoutAt;
    }

    // ──────────────────────────────────────────────
    //  State Variables
    // ──────────────────────────────────────────────

    address public admin;
    uint256 public platformFeeBps; // basis points (250 = 2.5%)
    uint256 public accumulatedFees;
    uint256 public bookingCounter;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% max
    uint256 public constant CANCELLATION_PENALTY_BPS = 1000; // 10%

    mapping(uint256 => Booking) public bookings;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event BookingCreated(
        uint256 indexed bookingId,
        uint256 propertyId,
        address tenant,
        address owner,
        uint256 amount
    );

    event Deposited(uint256 indexed bookingId, uint256 amount);

    event HandoverConfirmed(uint256 indexed bookingId, address confirmedBy);

    event FundsReleased(
        uint256 indexed bookingId,
        uint256 ownerAmount,
        uint256 feeAmount
    );

    event TenantRefunded(uint256 indexed bookingId, uint256 amount);

    event BookingCancelled(
        uint256 indexed bookingId,
        uint256 refundAmount,
        uint256 penaltyAmount
    );

    event DisputeRaised(uint256 indexed bookingId, address raisedBy);

    event DisputeResolved(uint256 indexed bookingId, bool refundedBuyer);

    event AdminTransferred(address oldAdmin, address newAdmin);

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyParty(uint256 bookingId) {
        Booking storage b = bookings[bookingId];
        require(
            msg.sender == b.tenant || msg.sender == b.owner,
            "Not a party"
        );
        _;
    }

    modifier inState(uint256 bookingId, BookingState expected) {
        require(bookings[bookingId].state == expected, "Invalid state");
        _;
    }

    modifier bookingExists(uint256 bookingId) {
        require(bookingId > 0 && bookingId <= bookingCounter, "Booking not found");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor(uint256 _feeBps) {
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        admin = msg.sender;
        platformFeeBps = _feeBps;
    }

    // ──────────────────────────────────────────────
    //  Core Functions
    // ──────────────────────────────────────────────

    /**
     * @notice Create a booking and deposit funds in one transaction.
     * @param propertyId  Off-chain property identifier
     * @param owner       Property owner's wallet address
     * @param timeoutDuration  Seconds until auto-refund becomes claimable
     */
    function createBooking(
        uint256 propertyId,
        address payable owner,
        uint256 timeoutDuration
    )
        external
        payable
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        require(msg.value > 0, "Deposit required");
        require(owner != address(0), "Invalid owner");
        require(owner != msg.sender, "Cannot book own property");
        require(timeoutDuration >= 1 days, "Timeout too short");

        bookingCounter++;
        uint256 bookingId = bookingCounter;

        bookings[bookingId] = Booking({
            propertyId: propertyId,
            tenant: payable(msg.sender),
            owner: owner,
            amount: msg.value,
            state: BookingState.Locked,
            tenantConfirmed: false,
            ownerConfirmed: false,
            createdAt: block.timestamp,
            timeoutAt: block.timestamp + timeoutDuration
        });

        emit BookingCreated(bookingId, propertyId, msg.sender, owner, msg.value);
        emit Deposited(bookingId, msg.value);

        return bookingId;
    }

    /**
     * @notice Confirm property handover.
     *         When BOTH tenant and owner have confirmed, funds are auto-released.
     */
    function confirmHandover(uint256 bookingId)
        external
        bookingExists(bookingId)
        onlyParty(bookingId)
        inState(bookingId, BookingState.Locked)
        nonReentrant
    {
        Booking storage b = bookings[bookingId];

        if (msg.sender == b.tenant) {
            require(!b.tenantConfirmed, "Already confirmed");
            b.tenantConfirmed = true;
        } else {
            require(!b.ownerConfirmed, "Already confirmed");
            b.ownerConfirmed = true;
        }

        emit HandoverConfirmed(bookingId, msg.sender);

        // If both confirmed, release funds
        if (b.tenantConfirmed && b.ownerConfirmed) {
            _releaseFunds(bookingId);
        }
    }

    /**
     * @notice Cancel a booking. Tenant may incur a penalty.
     */
    function cancelBooking(uint256 bookingId)
        external
        bookingExists(bookingId)
        nonReentrant
    {
        Booking storage b = bookings[bookingId];
        require(
            b.state == BookingState.Locked || b.state == BookingState.Created,
            "Cannot cancel"
        );
        require(
            msg.sender == b.tenant ||
            msg.sender == b.owner ||
            msg.sender == admin,
            "Not authorized"
        );

        bool isTenantCancel = msg.sender == b.tenant;

        uint256 refundAmount = b.amount;
        uint256 penaltyAmount = 0;

        // Tenant cancellation penalty
        if (isTenantCancel) {
            penaltyAmount = (b.amount * CANCELLATION_PENALTY_BPS) / 10000;
            refundAmount = b.amount - penaltyAmount;
            accumulatedFees += penaltyAmount;
        }

        b.state = BookingState.Cancelled;

        if (refundAmount > 0) {
            (bool sent, ) = b.tenant.call{value: refundAmount}("");
            require(sent, "Refund failed");
        }

        emit BookingCancelled(bookingId, refundAmount, penaltyAmount);
    }

    /**
     * @notice Anyone can trigger a refund if the timeout has expired.
     */
    function claimTimeout(uint256 bookingId)
        external
        bookingExists(bookingId)
        inState(bookingId, BookingState.Locked)
        nonReentrant
    {
        Booking storage b = bookings[bookingId];
        require(block.timestamp > b.timeoutAt, "Not timed out yet");

        b.state = BookingState.Refunded;

        (bool sent, ) = b.tenant.call{value: b.amount}("");
        require(sent, "Refund failed");

        emit TenantRefunded(bookingId, b.amount);
    }

    // ──────────────────────────────────────────────
    //  Dispute Functions
    // ──────────────────────────────────────────────

    function raiseDispute(uint256 bookingId)
        external
        bookingExists(bookingId)
        onlyParty(bookingId)
        inState(bookingId, BookingState.Locked)
    {
        bookings[bookingId].state = BookingState.Disputed;
        emit DisputeRaised(bookingId, msg.sender);
    }

    function resolveDispute(uint256 bookingId, bool refundBuyer)
        external
        bookingExists(bookingId)
        onlyAdmin
        inState(bookingId, BookingState.Disputed)
        nonReentrant
    {
        Booking storage b = bookings[bookingId];

        if (refundBuyer) {
            b.state = BookingState.Refunded;
            (bool sent, ) = b.tenant.call{value: b.amount}("");
            require(sent, "Refund failed");
            emit TenantRefunded(bookingId, b.amount);
        } else {
            _releaseFunds(bookingId);
        }

        emit DisputeResolved(bookingId, refundBuyer);
    }

    // ──────────────────────────────────────────────
    //  Admin Functions
    // ──────────────────────────────────────────────

    function refundTenant(uint256 bookingId)
        external
        bookingExists(bookingId)
        onlyAdmin
        nonReentrant
    {
        Booking storage b = bookings[bookingId];
        require(
            b.state == BookingState.Locked || b.state == BookingState.Disputed,
            "Cannot refund"
        );

        b.state = BookingState.Refunded;

        (bool sent, ) = b.tenant.call{value: b.amount}("");
        require(sent, "Refund failed");

        emit TenantRefunded(bookingId, b.amount);
    }

    function setPlatformFee(uint256 newFeeBps) external onlyAdmin {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }

    function withdrawFees() external onlyAdmin nonReentrant {
        uint256 amount = accumulatedFees;
        require(amount > 0, "No fees");
        accumulatedFees = 0;

        (bool sent, ) = payable(admin).call{value: amount}("");
        require(sent, "Withdraw failed");
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // ──────────────────────────────────────────────
    //  View Functions
    // ──────────────────────────────────────────────

    function getBooking(uint256 bookingId)
        external
        view
        bookingExists(bookingId)
        returns (Booking memory)
    {
        return bookings[bookingId];
    }

    function getBookingCount() external view returns (uint256) {
        return bookingCounter;
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFeeBps;
    }

    // ──────────────────────────────────────────────
    //  Internal Functions
    // ──────────────────────────────────────────────

    function _releaseFunds(uint256 bookingId) internal {
        Booking storage b = bookings[bookingId];
        b.state = BookingState.Completed;

        uint256 fee = (b.amount * platformFeeBps) / 10000;
        uint256 ownerAmount = b.amount - fee;
        accumulatedFees += fee;

        (bool sent, ) = b.owner.call{value: ownerAmount}("");
        require(sent, "Transfer failed");

        emit FundsReleased(bookingId, ownerAmount, fee);
    }
}
