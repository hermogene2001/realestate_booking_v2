import { Contract, JsonRpcSigner, BrowserProvider } from 'ethers';

interface NetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrl: string;
  etherscanTxPrefix: string;
  isLocal: boolean;
}

const SEPOLIA: NetworkConfig = {
  chainId: 11155111,
  chainName: 'Sepolia Testnet',
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://rpc.sepolia.org',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  etherscanTxPrefix: 'https://sepolia.etherscan.io/tx/',
  isLocal: false,
};

const HARDHAT_LOCAL: NetworkConfig = {
  chainId: 31337,
  chainName: 'Hardhat Local',
  rpcUrl: process.env.NEXT_PUBLIC_HARDHAT_RPC || 'http://127.0.0.1:8545',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  blockExplorerUrl: '',
  etherscanTxPrefix: '',  // no block explorer for local
  isLocal: true,
};

export const CONTRACT_ABI = [
  "function createBooking(uint256 propertyId, address payable owner, uint256 timeoutDuration) external payable returns (uint256)",
  "function confirmHandover(uint256 bookingId) external",
  "function cancelBooking(uint256 bookingId) external",
  "function claimTimeout(uint256 bookingId) external",
  "function raiseDispute(uint256 bookingId) external",
  "function getBooking(uint256 bookingId) external view returns (tuple(uint256 propertyId, address tenant, address owner, uint256 amount, uint8 state, bool tenantConfirmed, bool ownerConfirmed, uint256 createdAt, uint256 timeoutAt))",
  "function getBookingCount() external view returns (uint256)",
  "function getPlatformFee() external view returns (uint256)",
  "event BookingCreated(uint256 indexed bookingId, uint256 propertyId, address tenant, address owner, uint256 amount)",
  "event Deposited(uint256 indexed bookingId, uint256 amount)",
  "event HandoverConfirmed(uint256 indexed bookingId, address confirmedBy)",
  "event FundsReleased(uint256 indexed bookingId, uint256 ownerAmount, uint256 feeAmount)",
  "event TenantRefunded(uint256 indexed bookingId, uint256 amount)",
  "event BookingCancelled(uint256 indexed bookingId, uint256 refundAmount, uint256 penaltyAmount)",
  "event DisputeRaised(uint256 indexed bookingId, address raisedBy)",
  "event DisputeResolved(uint256 indexed bookingId, bool refundedBuyer)",
];

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');

export const NETWORK: NetworkConfig = CHAIN_ID === 11155111 ? SEPOLIA : HARDHAT_LOCAL;
export const ETHERSCAN_URL = NETWORK.blockExplorerUrl;
export const ETHERSCAN_TX_PREFIX = NETWORK.etherscanTxPrefix;
export const IS_LOCAL_NETWORK = NETWORK.isLocal;

// ── New contracts ──
export const PROPERTY_TOKEN_ABI = [
  "function mintShares(uint256 propertyId, uint256 shareCount, uint256 pricePerShare) external",
  "function buyShares(uint256 propertyId, uint256 amount) external payable",
  "function updatePrice(uint256 propertyId, uint256 newPrice) external",
  "function deactivateProperty(uint256 propertyId) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function totalShareCount(uint256 propertyId) external view returns (uint256)",
  "function getPropertyCount() external view returns (uint256)",
  "function getPropertyIds() external view returns (uint256[])",
  "event SharesMinted(uint256 indexed propertyId, uint256 totalShares, uint256 pricePerShare)",
  "event SharesPurchased(uint256 indexed propertyId, address buyer, uint256 amount, uint256 cost)",
];

export const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS || '';

export const REPUTATION_SCORE_ABI = [
  "function submitAttestation(address subject, uint8 score, string calldata comment) external",
  "function getReputation(address user) external view returns (tuple(uint256 totalScore, uint256 count, uint256 average, uint256 lastUpdated))",
  "function getAttestationCount(address user) external view returns (uint256)",
  "function getAttestations(address user) external view returns (tuple(address subject, address attester, uint8 score, string comment, uint256 timestamp)[])",
  "event ReputationUpdated(address indexed user, uint256 newAverage, uint256 totalCount)",
  "event AttestationCreated(address indexed subject, address indexed attester, uint8 score)",
];

export const REPUTATION_SCORE_ADDRESS = process.env.NEXT_PUBLIC_REPUTATION_SCORE_ADDRESS || '';

// ── Helper to get contract instances ──

export function getPropertyTokenContract(signer: JsonRpcSigner | BrowserProvider): Contract {
  return new Contract(PROPERTY_TOKEN_ADDRESS, PROPERTY_TOKEN_ABI, signer);
}

export function getEscrowContract(signer: JsonRpcSigner | BrowserProvider): Contract {
  return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export function getReputationContract(signer: JsonRpcSigner | BrowserProvider): Contract {
  return new Contract(REPUTATION_SCORE_ADDRESS, REPUTATION_SCORE_ABI, signer);
}

export function parseTokenAmount(amount: string): bigint {
  // Parse a decimal string to wei (18 decimals)
  const [whole, fraction = ''] = amount.split('.');
  const padded = fraction.padEnd(18, '0');
  return BigInt(whole + padded);
}
