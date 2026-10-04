import { expect } from "chai";
import { ethers } from "hardhat";
import { RealEstateEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("RealEstateEscrow", function () {
  let escrow: RealEstateEscrow;
  let admin: HardhatEthersSigner;
  let tenant: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  const FEE_BPS = 250n; // 2.5%
  const DEPOSIT = ethers.parseEther("1.0");
  const PROPERTY_ID = 1;
  const TIMEOUT = 30 * 24 * 60 * 60; // 30 days

  beforeEach(async function () {
    [admin, tenant, owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("RealEstateEscrow");
    escrow = await Factory.deploy(FEE_BPS);
    await escrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the admin correctly", async function () {
      expect(await escrow.admin()).to.equal(admin.address);
    });

    it("should set the platform fee", async function () {
      expect(await escrow.platformFeeBps()).to.equal(FEE_BPS);
    });

    it("should reject fee above maximum", async function () {
      const Factory = await ethers.getContractFactory("RealEstateEscrow");
      await expect(Factory.deploy(1001)).to.be.revertedWith("Fee too high");
    });
  });

  describe("Create Booking", function () {
    it("should create a booking with deposit", async function () {
      const tx = await escrow.connect(tenant).createBooking(
        PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT }
      );

      await expect(tx)
        .to.emit(escrow, "BookingCreated")
        .withArgs(1, PROPERTY_ID, tenant.address, owner.address, DEPOSIT);

      const booking = await escrow.getBooking(1);
      expect(booking.tenant).to.equal(tenant.address);
      expect(booking.owner).to.equal(owner.address);
      expect(booking.amount).to.equal(DEPOSIT);
      expect(booking.state).to.equal(1); // Locked
    });

    it("should reject zero deposit", async function () {
      await expect(
        escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: 0 })
      ).to.be.revertedWith("Deposit required");
    });

    it("should reject booking own property", async function () {
      await expect(
        escrow.connect(tenant).createBooking(PROPERTY_ID, tenant.address, TIMEOUT, { value: DEPOSIT })
      ).to.be.revertedWith("Cannot book own property");
    });

    it("should reject timeout less than 1 day", async function () {
      await expect(
        escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, 3600, { value: DEPOSIT })
      ).to.be.revertedWith("Timeout too short");
    });

    it("should increment booking counter", async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
      await escrow.connect(tenant).createBooking(2, owner.address, TIMEOUT, { value: DEPOSIT });
      expect(await escrow.getBookingCount()).to.equal(2);
    });
  });

  describe("Confirm Handover", function () {
    beforeEach(async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
    });

    it("should allow tenant to confirm", async function () {
      await expect(escrow.connect(tenant).confirmHandover(1))
        .to.emit(escrow, "HandoverConfirmed")
        .withArgs(1, tenant.address);

      const booking = await escrow.getBooking(1);
      expect(booking.tenantConfirmed).to.be.true;
      expect(booking.ownerConfirmed).to.be.false;
      expect(booking.state).to.equal(1); // Still Locked
    });

    it("should allow owner to confirm", async function () {
      await expect(escrow.connect(owner).confirmHandover(1))
        .to.emit(escrow, "HandoverConfirmed")
        .withArgs(1, owner.address);
    });

    it("should release funds when both confirm", async function () {
      await escrow.connect(tenant).confirmHandover(1);

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await escrow.connect(owner).confirmHandover(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const fee = (DEPOSIT * FEE_BPS) / 10000n;
      const ownerAmount = DEPOSIT - fee;

      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .withArgs(1, ownerAmount, fee);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(2); // Completed

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + ownerAmount - gasUsed);
    });

    it("should reject double confirmation by same party", async function () {
      await escrow.connect(tenant).confirmHandover(1);
      await expect(
        escrow.connect(tenant).confirmHandover(1)
      ).to.be.revertedWith("Already confirmed");
    });

    it("should reject confirmation by non-party", async function () {
      await expect(
        escrow.connect(other).confirmHandover(1)
      ).to.be.revertedWith("Not a party");
    });
  });

  describe("Cancel Booking", function () {
    beforeEach(async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
    });

    it("should allow tenant to cancel with penalty", async function () {
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);

      const tx = await escrow.connect(tenant).cancelBooking(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const penalty = (DEPOSIT * 1000n) / 10000n; // 10%
      const refund = DEPOSIT - penalty;

      await expect(tx)
        .to.emit(escrow, "BookingCancelled")
        .withArgs(1, refund, penalty);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(5); // Cancelled

      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);
      expect(tenantBalanceAfter).to.be.closeTo(
        tenantBalanceBefore + refund - gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("should allow owner to cancel with full refund to tenant", async function () {
      const tx = await escrow.connect(owner).cancelBooking(1);
      await expect(tx).to.emit(escrow, "BookingCancelled");

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(5);
    });

    it("should allow admin to cancel", async function () {
      await escrow.connect(admin).cancelBooking(1);
      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(5);
    });

    it("should reject cancel by non-party", async function () {
      await expect(
        escrow.connect(other).cancelBooking(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Timeout", function () {
    beforeEach(async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
    });

    it("should allow timeout claim after expiry", async function () {
      // Fast forward past timeout
      await time.increase(TIMEOUT + 1);

      const tx = await escrow.connect(other).claimTimeout(1);
      await expect(tx)
        .to.emit(escrow, "TenantRefunded")
        .withArgs(1, DEPOSIT);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(3); // Refunded
    });

    it("should reject timeout claim before expiry", async function () {
      await expect(
        escrow.connect(other).claimTimeout(1)
      ).to.be.revertedWith("Not timed out yet");
    });
  });

  describe("Disputes", function () {
    beforeEach(async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
    });

    it("should allow tenant to raise dispute", async function () {
      await expect(escrow.connect(tenant).raiseDispute(1))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1, tenant.address);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(4); // Disputed
    });

    it("should allow owner to raise dispute", async function () {
      await expect(escrow.connect(owner).raiseDispute(1))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1, owner.address);
    });

    it("should reject dispute by non-party", async function () {
      await expect(
        escrow.connect(other).raiseDispute(1)
      ).to.be.revertedWith("Not a party");
    });

    it("should allow admin to resolve dispute (refund tenant)", async function () {
      await escrow.connect(tenant).raiseDispute(1);

      const tx = await escrow.connect(admin).resolveDispute(1, true);
      await expect(tx)
        .to.emit(escrow, "TenantRefunded")
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, true);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(3); // Refunded
    });

    it("should allow admin to resolve dispute (pay owner)", async function () {
      await escrow.connect(tenant).raiseDispute(1);

      const tx = await escrow.connect(admin).resolveDispute(1, false);
      await expect(tx)
        .to.emit(escrow, "FundsReleased")
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, false);

      const booking = await escrow.getBooking(1);
      expect(booking.state).to.equal(2); // Completed
    });

    it("should reject non-admin dispute resolution", async function () {
      await escrow.connect(tenant).raiseDispute(1);
      await expect(
        escrow.connect(tenant).resolveDispute(1, true)
      ).to.be.revertedWith("Only admin");
    });
  });

  describe("Admin Functions", function () {
    it("should allow admin to force refund", async function () {
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });

      const tx = await escrow.connect(admin).refundTenant(1);
      await expect(tx)
        .to.emit(escrow, "TenantRefunded")
        .withArgs(1, DEPOSIT);
    });

    it("should allow admin to update platform fee", async function () {
      await escrow.connect(admin).setPlatformFee(500);
      expect(await escrow.platformFeeBps()).to.equal(500);
    });

    it("should reject fee above maximum", async function () {
      await expect(
        escrow.connect(admin).setPlatformFee(1001)
      ).to.be.revertedWith("Fee too high");
    });

    it("should allow admin to withdraw fees", async function () {
      // Create and complete a booking to accumulate fees
      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
      await escrow.connect(tenant).confirmHandover(1);
      await escrow.connect(owner).confirmHandover(1);

      const expectedFee = (DEPOSIT * FEE_BPS) / 10000n;
      expect(await escrow.accumulatedFees()).to.equal(expectedFee);

      await escrow.connect(admin).withdrawFees();
      expect(await escrow.accumulatedFees()).to.equal(0);
    });

    it("should allow admin to pause/unpause", async function () {
      await escrow.connect(admin).pause();

      await expect(
        escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT })
      ).to.be.reverted;

      await escrow.connect(admin).unpause();

      await escrow.connect(tenant).createBooking(PROPERTY_ID, owner.address, TIMEOUT, { value: DEPOSIT });
    });

    it("should allow admin transfer", async function () {
      await escrow.connect(admin).transferAdmin(other.address);
      expect(await escrow.admin()).to.equal(other.address);

      // Old admin can no longer act
      await expect(
        escrow.connect(admin).setPlatformFee(100)
      ).to.be.revertedWith("Only admin");
    });
  });

  describe("Edge Cases", function () {
    it("should reject operations on non-existent booking", async function () {
      await expect(escrow.getBooking(999)).to.be.revertedWith("Booking not found");
    });

    it("should handle multiple concurrent bookings", async function () {
      await escrow.connect(tenant).createBooking(1, owner.address, TIMEOUT, { value: DEPOSIT });
      await escrow.connect(tenant).createBooking(2, owner.address, TIMEOUT, { value: ethers.parseEther("2.0") });

      const b1 = await escrow.getBooking(1);
      const b2 = await escrow.getBooking(2);

      expect(b1.amount).to.equal(DEPOSIT);
      expect(b2.amount).to.equal(ethers.parseEther("2.0"));
      expect(b1.propertyId).to.equal(1);
      expect(b2.propertyId).to.equal(2);
    });
  });
});
