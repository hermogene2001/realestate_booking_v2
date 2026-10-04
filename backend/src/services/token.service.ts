import { prisma } from '../config/database';
import { env } from '../config/env';
import { ethers } from 'ethers';

const PROPERTY_TOKEN_ABI = [
  'function mintShares(uint256 propertyId, uint256 shareCount, uint256 pricePerShare) external',
  'function buyShares(uint256 propertyId, uint256 amount) external payable',
  'function updatePrice(uint256 propertyId, uint256 newPrice) external',
  'function balanceOf(address account, uint256 id) external view returns (uint256)',
  'function totalShareCount(uint256 propertyId) external view returns (uint256)',
  'function getPropertyCount() external view returns (uint256)',
  'function getPropertyIds() external view returns (uint256[])',
  'event SharesMinted(uint256 indexed propertyId, uint256 totalShares, uint256 pricePerShare)',
  'event SharesPurchased(uint256 indexed propertyId, address buyer, uint256 amount, uint256 cost)',
];

export class TokenService {
  private static getContract() {
    if (!env.PROPERTY_TOKEN_ADDRESS) throw new Error('PropertyToken address not configured');
    const provider = new ethers.JsonRpcProvider(env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(env.ADMIN_WALLET_PRIVATE_KEY, provider);
    return new ethers.Contract(env.PROPERTY_TOKEN_ADDRESS, PROPERTY_TOKEN_ABI, wallet);
  }

  static async mintShares(ownerId: number, propertyId: number, shareCount: number, pricePerShare: string) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== ownerId) throw new Error('Not authorized');

    const existing = await prisma.propertyShare.findFirst({ where: { propertyId, isActive: true } });
    if (existing) throw new Error('Shares already minted for this property');

    const contract = this.getContract();
    const priceWei = ethers.parseEther(pricePerShare);
    const tx = await contract.mintShares(propertyId, shareCount, priceWei);
    const receipt = await tx.wait();

    const share = await prisma.propertyShare.create({
      data: {
        propertyId,
        ownerId,
        shareCount,
        pricePerShare: priceWei.toString(),
        totalShares: shareCount,
        sharesForSale: shareCount,
        isOnChain: true,
      },
    });

    return { share, txHash: receipt.hash };
  }

  static async buyShares(buyerId: number, propertyShareId: number, amount: number) {
    const share = await prisma.propertyShare.findUnique({
      where: { id: propertyShareId },
      include: { property: true },
    });
    if (!share || !share.isActive) throw new Error('Share offering not found');
    if (amount > share.sharesForSale) throw new Error('Not enough shares for sale');

    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer?.walletAddress) throw new Error('Buyer must link a wallet');

    const contract = this.getContract();
    const cost = BigInt(share.pricePerShare) * BigInt(amount) / BigInt(1e18);

    const tx = await contract.buyShares(share.propertyId, amount, { value: cost });
    const receipt = await tx.wait();

    const purchase = await prisma.sharePurchase.create({
      data: {
        propertyShareId: share.id,
        buyerId,
        shareCount: amount,
        totalPrice: cost.toString(),
        txHash: receipt.hash,
      },
    });

    await prisma.propertyShare.update({
      where: { id: share.id },
      data: { sharesForSale: { decrement: amount } },
    });

    return purchase;
  }

  static async getSharesByProperty(propertyId: number) {
    return prisma.propertyShare.findMany({
      where: { propertyId, isActive: true },
      include: { owner: { select: { id: true, name: true } }, purchases: true },
    });
  }

  static async getUserShares(userId: number) {
    return prisma.sharePurchase.findMany({
      where: { buyerId: userId },
      include: {
        propertyShare: {
          include: { property: { select: { id: true, title: true, images: true, location: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOwnerShares(userId: number) {
    return prisma.propertyShare.findMany({
      where: { ownerId: userId, isActive: true },
      include: {
        property: { select: { id: true, title: true, images: true, location: true } },
        purchases: { include: { buyer: { select: { id: true, name: true } } } },
      },
    });
  }

  static async updatePrice(ownerId: number, propertyShareId: number, newPricePerShare: string) {
    const share = await prisma.propertyShare.findUnique({ where: { id: propertyShareId } });
    if (!share || share.ownerId !== ownerId) throw new Error('Not authorized');

    const priceWei = ethers.parseEther(newPricePerShare);
    const contract = this.getContract();
    const tx = await contract.updatePrice(share.propertyId, priceWei);
    await tx.wait();

    return prisma.propertyShare.update({
      where: { id: propertyShareId },
      data: { pricePerShare: priceWei.toString() },
    });
  }
}
