export interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  questions: string[];
  answer: string;
  priority?: number;
}

/**
 * Comprehensive knowledge base for the Kigali RE Copilot.
 * Covers every aspect of the platform — navigation, booking, escrow,
 * blockchain, payments, properties, reviews, disputes, profile, and more.
 */
const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── General / Intro ──────────────────────────────────────────────
  {
    id: 'intro-what-is',
    category: 'general',
    keywords: ['what is', 'kigali re', 'platform', 'about', 'real estate', 'booking'],
    questions: ['What is Kigali RE?', 'What is this platform?', 'Tell me about Kigali RE'],
    answer: `**Kigali Real Estate Booking** is a decentralized rental platform built on blockchain technology. It connects tenants and property owners in Kigali, Rwanda, using smart contract escrow to secure deposits. Every deposit is locked in a blockchain contract — no more deposit fraud. The platform also features AI-powered price predictions, fractional property ownership, on-chain reputation scoring, multi-language support, and a fully integrated booking system.`,
    priority: 10,
  },
  {
    id: 'intro-how-it-works',
    category: 'general',
    keywords: ['how it works', 'how does', 'process', 'steps', 'guide'],
    questions: ['How does it work?', 'How do I use the platform?', 'What are the steps?'],
    answer: `**How Kigali RE Works:**

1. **Browse & Select** — Browse verified property listings in Kigali. Use filters by district, price, bedrooms, or amenities.
2. **Book a Property** — Select your dates and create a booking. You'll be asked to connect your MetaMask wallet.
3. **Deposit to Escrow** — Pay your deposit in ETH. The smart contract locks it securely — neither the owner nor tenant can withdraw it unilaterally.
4. **Move In & Enjoy** — After check-in, confirm handover. Both parties must confirm for funds to release.
5. **Complete & Review** — Once the owner confirms, funds are released. Leave a review for the property.`,
    priority: 9,
  },
  {
    id: 'intro-supported-languages',
    category: 'general',
    keywords: ['language', 'translate', 'kinyarwanda', 'french', 'swahili', 'arabic', 'rw', 'fr', 'sw', 'ar'],
    questions: ['What languages are supported?', 'Can I use Kinyarwanda?', 'Does the platform support French?'],
    answer: `The platform supports **5 languages**: English (EN), Kinyarwanda (RW), French (FR), Swahili (SW), and Arabic (AR). You can switch languages anytime using the language dropdown in the top navigation bar. Property content and AI responses will adapt to your selected language.`,
    priority: 5,
  },

  // ── Account & Auth ───────────────────────────────────────────────
  {
    id: 'auth-create-account',
    category: 'auth',
    keywords: ['create account', 'register', 'sign up', 'new user', 'join'],
    questions: ['How do I create an account?', 'How to register?', 'Create an account'],
    answer: `Click **Register** in the top navigation bar. Fill in your full name, email address, password, and phone number. Select whether you are a **Tenant** (looking for property) or **Owner** (listing property). Choose your preferred language and click "Create Account". Verify your email and you're ready to go.`,
  },
  {
    id: 'auth-login',
    category: 'auth',
    keywords: ['login', 'sign in', 'log in', 'welcome back'],
    questions: ['How do I log in?', 'Sign in to my account', 'Login'],
    answer: `Click **Login** in the top navigation bar. Enter your email address and password, then click "Sign In". If you forgot your password, click "Forgot password?" to reset it.`,
  },
  {
    id: 'auth-forgot-password',
    category: 'auth',
    keywords: ['forgot password', 'reset password', 'change password', 'lost password'],
    questions: ['I forgot my password', 'How to reset password?', 'Change my password'],
    answer: `On the login page, click **"Forgot password?"**. Enter your registered email address and you'll receive a password reset link. Follow the instructions to create a new password.`,
  },
  {
    id: 'auth-roles',
    category: 'auth',
    keywords: ['role', 'tenant', 'owner', 'difference', 'types'],
    questions: ['What is the difference between Tenant and Owner?', 'What can an owner do?'],
    answer: `**Tenants** can browse properties, book rentals, pay deposits via escrow, leave reviews, earn reputation, and buy fractional ownership shares.\n\n**Owners** can list properties, manage bookings, confirm handover, mint fractional shares for their properties, respond to reviews, and view earnings analytics.\n\nYou choose your role during registration. Owners get access to a property management dashboard.`,
  },
  {
    id: 'auth-2fa',
    category: 'auth',
    keywords: ['2fa', 'two factor', 'authentication', 'security', 'mfa'],
    questions: ['How to enable two-factor authentication?', 'What is 2FA?', 'Enable 2FA'],
    answer: `Go to your **Profile** page and click **"Enable 2FA"**. You'll need an authenticator app like Google Authenticator or Authy. Scan the QR code with your app and enter the verification code to complete setup. 2FA adds an extra layer of security to your account.`,
  },
  {
    id: 'auth-kyc',
    category: 'auth',
    keywords: ['kyc', 'verify identity', 'verification', 'id', 'document'],
    questions: ['What is KYC?', 'How to verify my identity?', 'Upload ID'],
    answer: `KYC (Know Your Customer) is required for certain platform features. Go to your **Profile** → **KYC Verification**. Upload a clear photo or scan of your government-issued ID (passport, national ID, or driver's license). Our team will review and approve it, usually within 24 hours. Verified users get higher booking limits and trust badges.`,
  },

  // ── Properties ───────────────────────────────────────────────────
  {
    id: 'prop-browse',
    category: 'properties',
    keywords: ['browse', 'search', 'find', 'look', 'property', 'listings', 'available'],
    questions: ['How do I browse properties?', 'Find a property', 'Search listings'],
    answer: `Go to **Properties** in the navigation bar. You can:
• **Search** by title or location using the search bar
• **Filter by district** (Gasabo, Kicukiro, Nyarugenge)
• **Filter by price range** (min/max ETH)
• **Filter by bedrooms and bathrooms**
• **Toggle between List View and Map View**
• **Sort** by newest, price (low to high), or price (high to low)

Click on any property card to view full details, photos, amenities, reviews, and AI market analysis.`,
  },
  {
    id: 'prop-list-as-owner',
    category: 'properties',
    keywords: ['list property', 'add property', 'create listing', 'become owner', 'publish'],
    questions: ['How do I list my property?', 'Add a new property', 'Create a listing as owner'],
    answer: `Go to your **Dashboard** or **Properties → Add Property** (owner menu). Fill in:
• Title and description
• Location and district (Gasabo, Kicukiro, or Nyarugenge)
• Monthly price in ETH and deposit amount
• Bedrooms, bathrooms, area (m²)
• Click on the map to set the exact location
• Upload up to 5 images (JPEG, PNG, or WebP)
• Select amenities (WiFi, parking, pool, gym, security, etc.)

Click **"AI Suggest"** next to the price field to get an AI-recommended price based on similar properties in the same district. Once submitted, an admin will review and approve your listing.`,
    priority: 8,
  },
  {
    id: 'prop-approval',
    category: 'properties',
    keywords: ['approval', 'pending', 'review', 'admin approve', 'waiting'],
    questions: ['Why is my property pending approval?', 'How long does approval take?', 'Property not approved'],
    answer: `All new property listings require **admin approval** to ensure quality and prevent fraud. This usually takes **24-48 hours**. You'll see a yellow "Pending Approval" badge on your property card. Once approved, it becomes visible to all tenants. If rejected, you'll see the reason and can edit and resubmit.`,
  },
  {
    id: 'prop-edit',
    category: 'properties',
    keywords: ['edit property', 'update listing', 'modify', 'change price'],
    questions: ['How to edit my property?', 'Update property listing', 'Change property price'],
    answer: `Go to **Your Properties** (Dashboard → My Properties or Properties → Mine). Find the property and click **"Edit Property"**. You can only edit properties that have **not yet been approved**. After editing, it will be resubmitted for admin review. For approved properties, contact support for changes.`,
  },
  {
    id: 'prop-delete',
    category: 'properties',
    keywords: ['delete property', 'remove listing', 'delist'],
    questions: ['How to delete my property?', 'Remove a listing', 'Delist property'],
    answer: `Go to **Your Properties**, find the property, and click **"Delete"**. You cannot delete a property that has **active pending or locked bookings** — cancel those first. Past bookings are automatically cleaned up before deletion.`,
  },
  {
    id: 'prop-districts',
    category: 'properties',
    keywords: ['district', 'gasabo', 'kicukiro', 'nyarugenge', 'area', 'neighborhood'],
    questions: ['What districts are available?', 'Which neighborhoods are in Kigali?', 'Gasabo vs Kicukiro'],
    answer: `Properties are organized into Kigali's **three districts**:
• **Gasabo** — Includes Kimironko, Remera, Gisozi, Kacyiru. Upscale residential area with embassies, shopping malls, and restaurants. Popular with expats and professionals.
• **Kicukiro** — Includes Kicukiro Centre, Kanombe, Nyanza. Residential area near the airport with good road infrastructure and growing commercial centers.
• **Nyarugenge** — Includes Kigali City Centre, Nyamirambo, Kimisagara. The downtown area with markets, nightlife, and the busiest commercial zone.

Browse by district using the filter on the Properties page.`,
  },
  {
    id: 'prop-amenities',
    category: 'properties',
    keywords: ['amenities', 'features', 'wifi', 'parking', 'pool', 'gym', 'furnished'],
    questions: ['What amenities can owners list?', 'What features are available?', 'Property amenities list'],
    answer: `Owners can select from these amenities when listing a property:
• **WiFi** — High-speed internet
• **Parking** — Dedicated or secured parking
• **Pool** — Swimming pool access
• **Gym** — Fitness facilities
• **Security** — 24/7 security or gated compound
• **Garden** — Outdoor garden space
• **Balcony** — Private balcony or terrace
• **Furnished** — Fully furnished unit
• **Air Conditioning** — A/C unit or central AC
• **Water Heater** — Instant or tank water heater
• **Generator** — Backup power generator
• **CCTV** — Security cameras
• **Laundry** — In-unit or on-site laundry

These amenities are shown on property cards and detail pages to help tenants compare.`,
  },
  {
    id: 'prop-images',
    category: 'properties',
    keywords: ['images', 'photos', 'pictures', 'upload', 'gallery'],
    questions: ['How many photos can I upload?', 'What image formats are supported?', 'Upload property photos'],
    answer: `You can upload up to **5 images** per property. Supported formats: **JPEG, PNG, and WebP**. Each image must be under **5MB**. Good quality photos increase booking interest. The first image becomes the card cover photo.`,
  },
  {
    id: 'prop-documents',
    category: 'properties',
    keywords: ['document', 'title deed', 'ownership proof', 'verification', 'legal'],
    questions: ['Do I need to upload documents?', 'Property verification documents', 'Proof of ownership'],
    answer: `To get your property **verified** (green verified badge), upload property ownership documents via the **Property Documents** section on the edit page. This builds trust with potential tenants. Acceptable documents: title deed, lease agreement, tax receipt, or utility bill showing your name and property address. Verified properties show a ✅ badge and rank higher in search.`,
  },

  // ── Booking ──────────────────────────────────────────────────────
  {
    id: 'booking-create',
    category: 'booking',
    keywords: ['create booking', 'book', 'reserve', 'rent', 'how to book'],
    questions: ['How to book a property?', 'Create a booking', 'Rent a property'],
    answer: `**To book a property:**

1. Go to the property's detail page
2. Select your **start date** and **end date** using the calendar
3. Click **"Book Now"**
4. You'll be redirected to the booking detail page
5. **Connect your MetaMask wallet** (install MetaMask if you haven't)
6. Click **"Deposit to Escrow"** to lock the deposit in the smart contract
7. After the deposit is confirmed, your booking status changes to "Locked"
8. On move-in day, confirm the booking using the **"Confirm Booking"** button
9. Once both parties confirm, the funds are automatically released to the owner`,
    priority: 9,
  },
  {
    id: 'booking-dates',
    category: 'booking',
    keywords: ['dates', 'start date', 'end date', 'duration', 'calendar', 'when'],
    questions: ['What dates should I select?', 'How long can I book?', 'Booking duration'],
    answer: `Select your desired **move-in date** as the start date and **move-out date** as the end date. Bookings can range from a few days to several months. The total cost is calculated as: **(price per month / 30) × number of days**. Long-term rentals (3+ months) may qualify for discounts — contact the owner directly via the messaging system.`,
  },
  {
    id: 'booking-statuses',
    category: 'booking',
    keywords: ['status', 'pending', 'locked', 'completed', 'refunded', 'disputed', 'cancelled'],
    questions: ['What do booking statuses mean?', 'Booking status explanation', 'Pending vs Locked'],
    answer: `**Booking Statuses Explained:**

• **PENDING** — Created but deposit not yet paid. Still needs wallet connection and payment.
• **LOCKED** — Deposit has been paid to the escrow smart contract. Funds are secure.
• **COMPLETED** — Both tenant and owner confirmed handover. Funds released to the owner.
• **REFUNDED** — Booking was cancelled or timed out. Tenant received their deposit back.
• **DISPUTED** — A dispute has been raised. An admin will review and resolve.
• **CANCELLED** — Booking was cancelled before deposit. No funds were locked.`,
    priority: 7,
  },
  {
    id: 'booking-view-mine',
    category: 'booking',
    keywords: ['my bookings', 'my reservations', 'booking history', 'view bookings'],
    questions: ['How to see my bookings?', 'Where are my bookings?', 'Booking history'],
    answer: `Click **"My Bookings"** in the navigation bar or go to your **Dashboard**. You'll see a list of all your bookings with their status, property name, dates, deposit amount, and transaction hash. Click on any booking to view details, make payments, confirm handover, or raise a dispute.`,
  },
  {
    id: 'booking-cancel',
    category: 'booking',
    keywords: ['cancel booking', 'cancel reservation', 'cancel', 'refund'],
    questions: ['How to cancel a booking?', 'Cancel my reservation', 'Get a refund'],
    answer: `Go to the booking detail page and click **"Cancel Booking"**.

• **Before deposit (PENDING)** — Cancels immediately with no penalties.
• **After deposit (LOCKED)** — Cancellation triggers the smart contract's timeout mechanism. If cancelled before check-in, the deposit is refunded minus a small platform fee (set by the contract). If both parties agree to cancel, an admin can process the refund.

The smart contract ensures fair handling — neither party can unilaterally withdraw locked funds.`,
  },

  // ── Blockchain / Wallet ──────────────────────────────────────────
  {
    id: 'wallet-metamask',
    category: 'blockchain',
    keywords: ['metamask', 'wallet', 'connect', 'install', 'web3'],
    questions: ['How to install MetaMask?', 'Connect MetaMask wallet', 'What is MetaMask?'],
    answer: `**MetaMask** is a browser extension wallet that lets you interact with the Ethereum blockchain. To use Kigali RE:

1. Install MetaMask from **https://metamask.io/download/**
2. Create a new wallet (or import an existing one)
3. **Save your seed phrase** somewhere safe — this is your backup
4. Add the **Hardhat Local** network (automatically configured) or switch to Sepolia testnet
5. Fund your wallet with test ETH from a faucet (for Sepolia) or use the Hardhat local accounts

Once installed, click **"Connect Wallet"** anywhere in the app to link your MetaMask to your account.`,
    priority: 10,
  },
  {
    id: 'wallet-connect',
    category: 'blockchain',
    keywords: ['connect wallet', 'link wallet', 'pair', 'address'],
    questions: ['How to connect my wallet?', 'Link wallet to account', 'Connect'],
    answer: `Click the **"Connect Wallet"** button in the top navigation bar or on any booking page. MetaMask will pop up asking you to connect. Select the account you want to use and approve the connection. Once connected, your wallet address will appear in the navbar. You need to connect your wallet before making any deposit payments.`,
  },
  {
    id: 'wallet-network',
    category: 'blockchain',
    keywords: ['network', 'chain', 'hardhat', 'sepolia', 'localhost', 'wrong network'],
    questions: ['What network should I use?', 'Wrong network error', 'Switch network'],
    answer: `The platform runs on **Hardhat Local** network (Chain ID: 31337) for development. If you see a "Wrong Network" warning, click **"Switch Network"** to automatically switch to the correct one. The app will also try to add the network to MetaMask if it's not already configured. In production, the platform will use **Sepolia Testnet** (Chain ID: 11155111).`,
  },
  {
    id: 'wallet-gas',
    category: 'blockchain',
    keywords: ['gas fee', 'transaction fee', 'gas price', 'eth', 'cost'],
    questions: ['What are gas fees?', 'Why do I need ETH for gas?', 'Transaction costs'],
    answer: `**Gas fees** are small amounts of ETH paid to process transactions on the blockchain. On the Hardhat local network, gas is free. On testnet (Sepolia), gas fees are minimal (fractions of a cent). You need a small amount of ETH in your wallet to cover gas fees for:
• Depositing funds to escrow
• Confirming handover
• Cancelling a booking
• Raising a dispute
• Buying fractional shares

The platform does not charge any additional fees beyond the blockchain gas costs and a small platform fee (set in the smart contract).`,
  },
  {
    id: 'wallet-security',
    category: 'blockchain',
    keywords: ['security', 'safe', 'private key', 'seed phrase', 'scam', 'phishing'],
    questions: ['Is my wallet safe?', 'How secure is the platform?', 'Private key safety'],
    answer: `**Security best practices:**
• **Never share your seed phrase or private key** with anyone — support will never ask for it
• Only connect your wallet to trusted dApps
• The smart contract is audited and funds cannot be withdrawn by either party unilaterally
• Use **2FA** (two-factor authentication) on your account
• Always verify you're on the correct website (check the URL)
• For maximum security, use a dedicated wallet for this platform`,
  },
  {
    id: 'wallet-balance',
    category: 'blockchain',
    keywords: ['balance', 'eth balance', 'check balance', 'funds', 'how much eth'],
    questions: ['How to check my ETH balance?', 'My wallet balance', 'How much ETH do I have?'],
    answer: `Your ETH balance is shown in the top navigation bar next to your wallet address once connected. For Hardhat local network, you can use any of the pre-funded test accounts (each has 10,000 ETH). For Sepolia testnet, get free test ETH from a faucet like https://sepoliafaucet.com/.`,
  },

  // ── Escrow / Payments ────────────────────────────────────────────
  {
    id: 'escrow-what-is',
    category: 'payments',
    keywords: ['escrow', 'smart contract', 'deposit protection', 'secure'],
    questions: ['What is escrow?', 'How does escrow work?', 'Deposit protection'],
    answer: `**Smart Contract Escrow** is the core innovation of Kigali RE. Here's how it works:

1. **You deposit ETH** into the smart contract when booking
2. The contract **locks the funds** — neither you nor the owner can take them out alone
3. After you move in and confirm everything is good, confirm **handover**
4. After the **owner also confirms**, the smart contract automatically **releases funds** to the owner
5. If there's a dispute, an admin can resolve it and the contract will follow the resolution

This eliminates deposit fraud because the funds are controlled by code, not by any person. The contract is transparent and verifiable on the blockchain.`,
    priority: 10,
  },
  {
    id: 'escrow-timeout',
    category: 'payments',
    keywords: ['timeout', 'expire', 'claim timeout', 'deadline'],
    questions: ["What happens if the owner doesn't confirm?", 'Escrow timeout', 'Claim timeout'],
    answer: `If the owner doesn't confirm handover within the **timeout period** (usually 7 days after the booking end date), the tenant can **claim the timeout**. This refunds the deposit to the tenant automatically. Similarly, if the tenant doesn't confirm, the owner can claim the timeout to receive the funds. The timeout mechanism ensures neither party can stall indefinitely.`,
  },
  {
    id: 'escrow-payment-methods',
    category: 'payments',
    keywords: ['payment method', 'pay', 'momo', 'mtn', 'card', 'credit card', 'mobile money'],
    questions: ['Can I pay with mobile money?', 'Payment methods available', 'Pay with MTN MoMo'],
    answer: `The platform supports multiple payment methods:
• **MetaMask (ETH)** — The primary method. Deposit directly from your crypto wallet.
• **MTN MoMo** — Mobile Money payment option (in select regions).
• **Card Payment** — Credit/debit card (processed via on-ramp integration).
• **Manual ETH** — Send ETH directly to the contract address and provide the transaction hash.

Choose your preferred method on the booking detail page. The escrow system works the same way regardless of payment method — the funds end up locked in the smart contract.`,
  },

  // ── Disputes ─────────────────────────────────────────────────────
  {
    id: 'dispute-raise',
    category: 'disputes',
    keywords: ['dispute', 'problem', 'issue', 'complain', 'raise dispute', 'conflict'],
    questions: ['How to raise a dispute?', 'I have an issue with my booking', 'Report a problem'],
    answer: `Go to the booking detail page and click **"Raise Dispute"**. Provide details about the issue — property condition, deposit disagreement, handover issues, etc. An admin will review the case and make a fair decision. While a dispute is active, the funds remain locked in the smart contract. The admin can:
• **Release funds to the owner** if the tenant is at fault
• **Refund the tenant** if the owner is at fault
• **Split the deposit** in proportion to fault`,
  },
  {
    id: 'dispute-resolution',
    category: 'disputes',
    keywords: ['resolve', 'resolution', 'admin decision', 'how long'],
    questions: ['How are disputes resolved?', 'How long does dispute resolution take?', 'Dispute process'],
    answer: `When a dispute is raised, our admin team reviews all evidence including:
• Booking dates and terms
• Communication between parties
• Any photos or documentation provided
• Previous reviews and reputation scores

Disputes are typically resolved within **48 hours**. Both parties are notified of the decision. The admin's resolution is executed through the smart contract, ensuring transparency and immutability.`,
  },

  // ── Reviews ──────────────────────────────────────────────────────
  {
    id: 'review-leave',
    category: 'reviews',
    keywords: ['review', 'rate', 'rating', 'stars', 'feedback', 'comment'],
    questions: ['How to leave a review?', 'Rate a property', 'Write a review'],
    answer: `After your booking is completed, you can leave a review on the property page. Rate from **1-5 stars** and write a comment about your experience. Reviews help other tenants make informed decisions and help owners improve their properties. Owners can also reply to reviews.`,
  },
  {
    id: 'review-owner-reply',
    category: 'reviews',
    keywords: ['owner reply', 'respond to review', 'reply to review'],
    questions: ['Can owners reply to reviews?', 'How to respond to a review as owner?'],
    answer: `Yes, property owners can reply to reviews left by tenants. Go to your property's page, find the review, and click **"Reply"** or the reply icon. Your reply will appear below the tenant's review. Use this to address concerns, thank the tenant, or provide additional context.`,
  },

  // ── AI Features ──────────────────────────────────────────────────
  {
    id: 'ai-copilot',
    category: 'ai',
    keywords: ['copilot', 'ai', 'chat', 'assistant', 'kigali re copilot', 'bot'],
    questions: ['What is the Kigali RE Copilot?', 'How does the AI assistant work?', 'Chat with AI'],
    answer: `**Kigali RE Copilot** is the AI assistant built into the platform. You can access it from the chat icon in the bottom-right corner of any page. It can:

• **Answer questions** about the platform, booking process, or blockchain
• **Explain escrow** in plain language
• **Show available properties** based on your needs
• **Provide market insights** and price trends
• **Help with troubleshooting** — wallet connections, payments, etc.
• **Guide you through MetaMask setup**

The Copilot uses a trained AI model combined with real-time data from the platform. No question is too simple — just ask!`,
    priority: 8,
  },
  {
    id: 'ai-price-prediction',
    category: 'ai',
    keywords: ['price prediction', 'ai price', 'suggested price', 'fair price', 'market analysis'],
    questions: ['How does AI price prediction work?', 'What is the suggested price?', 'AI market analysis'],
    answer: `The **AI Price Prediction** system analyzes all properties in our database to estimate fair market prices. When you create a listing as an owner, click **"AI Suggest"** next to the price field. The system:

1. Finds comparable properties in the same district
2. Adjusts for bedrooms, bathrooms, area, and amenities
3. Calculates a predicted price with a confidence score
4. Shows a confidence bar and comparable count

For tenants, the **FairPriceBadge** on property cards shows if a listing is priced fairly (green), a great deal (blue), or above market (amber) compared to similar properties.

The system continuously improves as more properties are added and bookings are completed.`,
  },
  {
    id: 'ai-smart-search',
    category: 'ai',
    keywords: ['smart search', 'natural language', 'ai search', 'search properties'],
    questions: ['What is AI smart search?', 'Natural language search', 'Search by describing'],
    answer: `**Smart Search** lets you find properties using natural language. Instead of filtering by dropdowns, just type what you want. For example:
• "Modern 2-bedroom apartment in Kicukiro under 0.5 ETH"
• "Villa with pool in Gasabo near the airport"
• "Affordable studios near Kacyiru"

The AI parses your query and finds matching properties. Access it from the search bar on the Properties page.`,
  },
  {
    id: 'ai-description',
    category: 'ai',
    keywords: ['generate description', 'ai description', 'property description', 'auto write'],
    questions: ['Can AI generate property descriptions?', 'Auto-generate description', 'Description generator'],
    answer: `Yes! When creating or editing a property listing, you can use the **AI Description Generator**. Enter your property title, district, bedrooms, bathrooms, and amenities, and the AI will write a professional, compelling description for you. This saves time and helps attract more tenants with well-written listings.`,
  },

  // ── Reputation ───────────────────────────────────────────────────
  {
    id: 'reputation-onchain',
    category: 'reputation',
    keywords: ['reputation', 'on-chain', 'rating', 'score', 'trust', 'attestation'],
    questions: ['What is on-chain reputation?', 'How does reputation work?', 'Reputation scoring'],
    answer: `**On-Chain Reputation** is a trust system built on the blockchain. After a completed booking, tenants and owners can rate each other with a score of **1-5**. The score is stored on the blockchain (immutable and transparent) and a weighted average is calculated.

Your reputation:
• Shows as stars (★★★★★) next to your profile
• Helps tenants choose trustworthy owners
• Helps owners choose reliable tenants
• Is permanently recorded — you can't erase a bad rating

The system encourages honest, fair dealings for everyone.`,
  },

  // ── Fractional Ownership ─────────────────────────────────────────
  {
    id: 'fractional-what-is',
    category: 'fractional',
    keywords: ['fractional', 'shares', 'ownership', 'token', 'invest', 'property token'],
    questions: ['What is fractional ownership?', 'How to buy property shares?', 'Invest in property'],
    answer: `**Fractional Ownership** lets you own a piece of a property by buying shares. Each property is tokenized as an ERC-1155 token on the blockchain. You can:

• **Buy shares** in a property for as little as 1 share
• **Earn proportional income** when the property is rented
• **Trade shares** (future feature) on the marketplace
• **Start small** — no need to buy an entire property

Go to any property with fractional shares available, connect your wallet, and use the **"Buy Shares"** section to purchase. Your shares appear in **"My Shares"** in your profile menu.`,
    priority: 7,
  },
  {
    id: 'fractional-owner-mint',
    category: 'fractional',
    keywords: ['mint shares', 'create shares', 'tokenize', 'owner mint'],
    questions: ['How do I mint shares for my property?', 'Tokenize my property', 'Create fractional shares'],
    answer: `As a property owner, you can mint fractional shares for your approved properties. Go to **Your Properties**, click **"Manage Shares"**, and set:
• **Total shares** — How many shares to create
• **Price per share** — Cost in ETH for each share

Once minted, tenants can buy shares directly from the property detail page. You retain full ownership of the property while sharing rental income with shareholders.`,
  },

  // ── Notifications ────────────────────────────────────────────────
  {
    id: 'notifications-view',
    category: 'notifications',
    keywords: ['notification', 'alert', 'bell', 'notify', 'message'],
    questions: ['How to see notifications?', 'Where are notifications?', 'Notification bell'],
    answer: `Click the **bell icon** 🔔 in the top navigation bar to view your notifications. You'll be notified about:
• Booking confirmations
• Deposit confirmations
• Handover pending reminders
• Fund releases
• Refund issued
• New reviews received
• Property approved/rejected
• New messages from other users

Unread notifications show a red badge with the count. Click any notification to go to the relevant page.`,
  },
  {
    id: 'notifications-mark-read',
    category: 'notifications',
    keywords: ['mark read', 'dismiss', 'clear notifications'],
    questions: ['How to mark notifications as read?', 'Clear all notifications'],
    answer: `In the notification dropdown, click **"Mark All Read"** to clear all unread notifications. You can also click individual notifications to mark them as read and navigate to the relevant page.`,
  },

  // ── Messaging ────────────────────────────────────────────────────
  {
    id: 'messaging-send',
    category: 'messaging',
    keywords: ['message', 'chat', 'contact', 'send message', 'inbox'],
    questions: ['How to message an owner?', 'Contact property owner', 'Send a message'],
    answer: `On a property detail page, click the **"Message"** button to send a message to the owner. You can also go to the main **Messages** page from the navigation. Use messages to:
• Ask questions about a property
• Negotiate price or terms
• Arrange viewing appointments
• Discuss check-in details

Messages are organized by conversation. You'll receive a notification when you get a new message.`,
  },

  // ── Insurance ────────────────────────────────────────────────────
  {
    id: 'insurance-what-is',
    category: 'insurance',
    keywords: ['insurance', 'cover', 'protect', 'damage', 'theft'],
    questions: ['What insurance is available?', 'Property insurance', 'Tenant insurance'],
    answer: `The platform offers **rental insurance** for both tenants and owners. Insurance covers:
• **Property damage** — Accidental damage to the property
• **Theft** — Stolen belongings during the rental period
• **Liability** — Injury to guests or third parties

Insurance can be added during the booking process. Premiums are calculated based on the property value, rental amount, and duration. Contact support for detailed coverage information.`,
  },

  // ── Owner Dashboard ──────────────────────────────────────────────
  {
    id: 'owner-dashboard',
    category: 'owner',
    keywords: ['dashboard', 'owner dashboard', 'analytics', 'earnings', 'income'],
    questions: ['What analytics are available for owners?', 'Owner dashboard overview', 'Track earnings'],
    answer: `The **Owner Dashboard** (Dashboard → Overview) provides:
• **Total listings** — Your approved and pending properties
• **Active bookings** — Current tenants and upcoming arrivals
• **Total earnings** — ETH earned from completed bookings
• **Booking history** — Past bookings with status and amounts
• **Revenue chart** — Monthly earnings visualized
• **Property performance** — Views, inquiries, booking rates per property

Use this data to make informed decisions about pricing and property management.`,
  },
  {
    id: 'owner-handover',
    category: 'owner',
    keywords: ['confirm handover', 'handover', 'release funds', 'owner confirm'],
    questions: ['When should I confirm handover?', 'How to release funds as owner?', 'Confirm tenant handover'],
    answer: `After the tenant moves in and confirms everything is satisfactory, confirm the booking by going to the booking and clicking **"Confirm Booking"**. You should only confirm after:
• The tenant has inspected the property
• Both parties agree the condition is acceptable
• The rental period has started

Once confirmed, the escrow funds are automatically released to your wallet. If you don't confirm within the timeout period, the tenant can claim a refund.`,
  },

  // ── Troubleshooting ──────────────────────────────────────────────
  {
    id: 'trouble-metamask-not-connecting',
    category: 'troubleshooting',
    keywords: ['metamask not connecting', 'wallet not connecting', 'connection issue', 'can not connect'],
    questions: ["MetaMask won't connect", 'Wallet connection issues', "Can't connect my wallet"],
    answer: `**MetaMask connection troubleshooting:**

1. Make sure MetaMask is **installed and unlocked**
2. Refresh the page and try again
3. Check that you're on the **correct network** (Hardhat Local: 31337 or Sepolia: 11155111)
4. If the button does nothing, your browser might be blocking MetaMask
5. Try **disconnecting and reconnecting** MetaMask
6. Clear your browser cache and retry

If nothing works, try a different browser (Chrome or Firefox recommended).`,
  },
  {
    id: 'trouble-transaction-failed',
    category: 'troubleshooting',
    keywords: ['transaction failed', 'tx failed', 'error', 'metamask error', 'reverted'],
    questions: ['Why did my transaction fail?', 'Transaction reverted', 'MetaMask transaction error'],
    answer: `**Transaction failures** can happen for several reasons:

• **Insufficient gas** — Make sure you have enough ETH for gas fees (on Hardhat local this is not an issue)
• **Wrong network** — Switch to Hardhat Local (31337) or the correct network
• **Insufficient balance** — You need enough ETH for both the deposit and gas
• **Contract reverts** — This usually means invalid booking ID, expired timeout, or wrong state
• **Nonce error** — Reset your MetaMask activity (Settings → Advanced → Clear activity tab data)

The platform shows clear error messages for most contract reverts. If you see "CALL_EXCEPTION", it usually means the booking was not found on-chain (the blockchain booking ID might be missing from the database).`,
  },
  {
    id: 'trouble-page-not-loading',
    category: 'troubleshooting',
    keywords: ['page not loading', 'blank page', 'error page', 'crash', 'not working'],
    questions: ['Page is blank', 'Site not loading', 'Getting an error'],
    answer: `**If the page isn't loading:**

1. **Refresh** the page (Ctrl+F5 or Cmd+Shift+R)
2. **Clear your browser cache** and cookies
3. **Check your internet connection**
4. **Try a different browser** (Chrome, Firefox, Edge)
5. **Disable browser extensions** that might interfere (ad blockers, privacy tools)
6. Check if the **backend server is running** (port 5001) and the **blockchain node** (port 8545)

If the problem persists, contact support with the error message and your browser console logs (F12 → Console tab).`,
  },
  {
    id: 'trouble-login-issue',
    category: 'troubleshooting',
    keywords: ['cannot login', 'login error', 'wrong password', 'account locked'],
    questions: ["Can't log in", 'Login failed', 'Account locked or disabled'],
    answer: `**Login troubleshooting:**

1. Make sure you're using the correct **email and password**
2. Check for **Caps Lock** — passwords are case-sensitive
3. Click **"Forgot password?"** to reset if needed
4. If you still can't log in, your account might be **banned** by an admin (contact support)
5. Clear browser cookies and try again

If you registered but never verified your email, check your spam folder for the verification email.`,
  },
  {
    id: 'trouble-book-owner-property',
    category: 'troubleshooting',
    keywords: ['book my own property', 'owner booking', 'cannot book'],
    questions: ['Can I book my own property?', "Why can't I book?", 'Booking my own listing'],
    answer: `As a property **Owner**, you cannot book your own listed property. The system prevents owners from creating bookings on their own listings to avoid fake reservations. If you want to test the booking flow, create a separate **Tenant account** with a different email address.`,
  },

  // ── Admin ────────────────────────────────────────────────────────
  {
    id: 'admin-panel',
    category: 'admin',
    keywords: ['admin', 'admin panel', 'moderate', 'manage platform'],
    questions: ['What can admins do?', 'Admin panel overview', 'Admin features'],
    answer: `The **Admin Dashboard** provides full platform management:

• **Overview** — Platform statistics (users, properties, bookings, escrow volume)
• **Users** — View, ban, or unban users
• **Properties** — Approve or reject new listings, view all properties
• **Bookings** — Monitor all bookings, resolve disputes
• **Transactions** — View all on-chain transactions
• **Fraud Detection** — Automated fraud alerts and analysis

Only users with the **ADMIN** role can access this panel.`,
  },

  // ── Platform / Tech ──────────────────────────────────────────────
  {
    id: 'tech-stack',
    category: 'tech',
    keywords: ['technology', 'tech stack', 'built with', 'backend', 'frontend', 'blockchain'],
    questions: ['What tech stack is used?', 'How is the platform built?', 'What technologies?'],
    answer: `**Kigali RE Tech Stack:**

• **Frontend** — Next.js 14 (App Router), React, TypeScript, Tailwind CSS
• **Backend** — Express.js, TypeScript, Prisma ORM
• **Database** — MySQL
• **Blockchain** — Solidity smart contracts (Hardhat development environment)
• **AI/ML** — Custom TypeScript NLP engine (tokenization, TF-IDF, cosine similarity), local intent classification, and RAG system
• **Wallet** — MetaMask integration via ethers.js
• **Mobile** — React Native (Expo) for Android and iOS

Everything runs locally on your machine during development — backend on port 5001, frontend on port 3000, and the Hardhat blockchain node on port 8545.`,
  },
  {
    id: 'contracts-list',
    category: 'tech',
    keywords: ['smart contract', 'contract address', 'deployed', 'solidity'],
    questions: ['What smart contracts are deployed?', 'Contract addresses', 'List of contracts'],
    answer: `**Deployed Smart Contracts:**

1. **RealEstateEscrow** — Main escrow contract for booking deposits
   - Manages deposits, handovers, disputes, timeouts, and refunds
2. **PropertyDeedNFT** — NFT representation of property ownership
3. **DAOGovernance** — Platform governance and voting
4. **PropertyToken** — ERC-1155 token for fractional property shares
5. **ReputationScore** — On-chain reputation attestation and scoring

All contracts are deployed to the local Hardhat network (Chain ID: 31337). Contract addresses are stored in environment variables.`,
  },

  // ── Casual / Chit-Chat ───────────────────────────────────────────
  {
    id: 'casual-greeting',
    category: 'casual',
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    questions: ['Hi', 'Hello', 'Hey there', 'Good morning'],
    answer: `Hello! 👋 Welcome to Kigali RE. I'm the **Kigali RE Copilot**, your AI assistant. I can help you find properties, explain how the platform works, guide you through blockchain features, or just answer your questions. What can I help you with today?`,
    priority: 5,
  },
  {
    id: 'casual-how-are-you',
    category: 'casual',
    keywords: ['how are you', 'how do you do', 'whats up', 'sup'],
    questions: ['How are you?', 'How are you doing?'],
    answer: `I'm doing great! 🤖 I'm here and ready to help you with anything about Kigali RE. Whether you want to browse properties, understand escrow, connect your wallet, or learn about fractional ownership — just ask!`,
  },
  {
    id: 'casual-thanks',
    category: 'casual',
    keywords: ['thanks', 'thank you', 'ty', 'thx', 'appreciate'],
    questions: ['Thank you', 'Thanks for the help', 'Thanks!'],
    answer: `You're very welcome! 😊 I'm glad I could help. If you have any more questions about Kigali RE, property booking, escrow, or anything else — don't hesitate to ask. Happy renting!`,
  },
  {
    id: 'casual-bye',
    category: 'casual',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'cya', 'farewell'],
    questions: ['Bye', 'Goodbye', 'See you later'],
    answer: `Goodbye! 👋 Thanks for using Kigali RE. If you need help later, I'll be right here. Have a great day!`,
  },
  {
    id: 'casual-who-are-you',
    category: 'casual',
    keywords: ['who are you', 'what are you', 'your name', 'about you'],
    questions: ['Who are you?', 'What are you?', 'Tell me about yourself'],
    answer: `I'm the **Kigali RE Copilot** — your AI-powered assistant for the Kigali Real Estate Booking platform. I'm built with a custom NLP engine trained on the entire platform knowledge base and property data. I can answer questions, help with bookings, explain blockchain concepts, and guide you through every feature of the platform. I work entirely offline using locally trained models — no external AI APIs required! 😊`,
  },
  {
    id: 'casual-capabilities',
    category: 'casual',
    keywords: ['what can you do', 'capabilities', 'features', 'help', 'what can you help'],
    questions: ['What can you do?', 'What are your capabilities?', 'How can you help me?'],
    answer: `**Here's what I can do for you:** 🚀

• **🏠 Find Properties** — Search, filter, and compare rental listings
• **💰 Price Analysis** — AI-powered price predictions and fair price checks
• **📖 Explain Escrow** — Plain-language walkthrough of how deposit protection works
• **🔗 Wallet Help** — Guide you through MetaMask setup and connection
• **❓ Answer Questions** — Anything about the platform, booking, or blockchain
• **📊 Market Trends** — District-level pricing and availability insights
• **🏷️ Fractional Ownership** — Explain how to buy/sell property shares
• **⭐ Reputation** — On-chain scoring and trust system

Just ask me anything! I'm trained on the complete Kigali RE knowledge base.`,
  },

  // ── Thesis / Research ──────────────────────────────────────────────
  {
    id: 'thesis-overview',
    category: 'thesis',
    keywords: ['thesis', 'capstone', 'project', 'research', 'bachelor', 'ukundayezu', 'hermogene', 'university', 'rwanda', 'musanze'],
    questions: ['What is this thesis about?', 'Tell me about the capstone project', 'Who wrote this thesis?', 'What university is this thesis from?'],
    answer: `**Capstone Project:** Real Estate Booking System Using Smart Contract — A Case Study of Kigali

**Author:** UKUNDAYEZU Hermogene (Reg. No.: 25RP18177)
**Supervisor:** UWIZEYE Samuel
**Co-supervisor:** MBABAZI Mary
**Department:** ICT, Information Technology (RQF Level 8)
**Institution:** Musanze, Rwanda
**Date:** May 2026

The thesis addresses deposit fraud and information asymmetry in Kigali's informal rental market by proposing a decentralized real estate booking system using Solidity smart contract escrow on Ethereum. It was validated via Hardhat testing against 7 vulnerability points. The system uses a hybrid Web3 architecture with Next.js 14 frontend, Express.js backend, MySQL/Prisma off-chain storage, and Solidity smart contracts on Hardhat localhost.`,
    priority: 8,
  },
  {
    id: 'thesis-problem',
    category: 'thesis',
    keywords: ['problem', 'deposit fraud', 'ghost listing', 'abakomisiyoneri', 'broker', 'informal', 'scam', 'theft', 'trust', 'information asymmetry', 'kigali'],
    questions: ['What problem does this thesis solve?', 'What is deposit fraud?', 'What are ghost listings?', 'What is the Abakomisiyoneri problem?', 'Why is the rental market in Kigali broken?'],
    answer: `**The Core Problem:** High risk of deposit fraud in Kigali's informal rental market.

Key Issues:
1. **Ghost Listings** — Brokers (locally known as *Abakomisiyoneri*) advertise properties they don't actually manage. Tenants pay deposits for non-existent homes.
2. **Deposit Theft** — After receiving a deposit, brokers disappear. There is no trustless digital escrow to protect tenant money.
3. **Information Asymmetry** — Tenants cannot verify property ownership or availability. Brokers exploit this knowledge gap to inflate prices.
4. **No Formal Escrow** — The informal market lacks any automated, transparent deposit protection mechanism. Agreements are undocumented.

Impact: 68% of Kigali tenants have experienced deposit disputes (Mugisha & Nsabimana, 2020). This impedes SDG 11 (Sustainable Cities), AU Agenda 2063, and Rwanda's NST1 / Smart Rwanda Master Plan.`,
    priority: 9,
  },
  {
    id: 'thesis-escrow-mechanism',
    category: 'thesis',
    keywords: ['escrow', 'smart contract', 'solidity', 'deposit', 'lock', 'release', 'multi-sig', 'multisig', 'handover', 'trustless', 'blockchain escrow', 'how escrow works'],
    questions: ['How does the smart contract escrow work?', 'Explain the escrow mechanism', 'How are deposits protected?', 'What is multi-signature handover?', 'How does the booking deposit process work?'],
    answer: `**Smart Contract Escrow Mechanism (RealEstateEscrow.sol — 393 lines)**

The escrow has 6 states: **Created → Locked → Completed / Refunded / Cancelled / Disputed**

**Process:**
1. **Create Booking** — Tenant initiates booking (~89K gas). Deposit is locked in the contract.
2. **Lock Funds** — Neither party can withdraw funds unilaterally. The contract acts as a neutral custodian.
3. **Confirm Booking** — After physical inspection, both tenant AND owner must sign (multi-signature) to release funds (~32K gas). This prevents unilateral fund access.
4. **Cancel / Refund** — Tenant can cancel before handover; funds are automatically refunded (~28K gas).
5. **Dispute** — If something goes wrong, either party can raise a dispute (~24K gas). An admin resolves it (~30K gas).
6. **Timeout** — If the owner doesn't respond, the booking times out and funds are returned to the tenant (~25K gas).

**Security:** Uses OpenZeppelin's ReentrancyGuard and Pausable patterns to prevent reentrancy attacks. Internal \`_releaseFunds\` function ensures atomic state transitions. The contract admin collects a 2.5% platform fee.`,
    priority: 9,
  },
  {
    id: 'thesis-booking-lifecycle',
    category: 'thesis',
    keywords: ['booking lifecycle', 'booking process', 'steps', 'flow', 'tenant journey', 'how to book', 'book property', 'complete flow'],
    questions: ['What is the complete booking lifecycle?', 'Walk me through the booking flow step by step', 'How does a tenant book a property from start to finish?'],
    answer: `**Complete Booking Lifecycle (from the thesis)**

1. **Property Discovery** — Tenant browses verified listings on the platform, filters by district, price, bedrooms, or amenities.
2. **Initiates Booking** — Tenant selects dates and clicks "Book Now". A booking request is created in the system.
3. **Owner Approval** — The property owner reviews and accepts the booking request.
4. **Deposit to Escrow** — Tenant connects MetaMask and deposits ETH. The smart contract locks the deposit. Neither party can access it unilaterally.
5. **Physical Move-In** — Tenant inspects the property and moves in.
6. **Multi-Signature Handover** — Both tenant AND owner confirm handover on-chain. Only then are funds released from escrow.
7. **Complete & Review** — Funds are transferred to the owner (minus 2.5% platform fee). Tenant leaves a review.

**If something goes wrong:**
- Tenant can cancel before handover → automatic refund.
- Either party can raise a dispute → admin resolves.
- Owner doesn't respond → timeout auto-refunds the tenant.`,
    priority: 8,
  },
  {
    id: 'thesis-research-methodology',
    category: 'thesis',
    keywords: ['methodology', 'research design', 'applied software engineering', 'sampling', 'data collection', 'agile', 'uml', 'interviews', 'purposive sampling'],
    questions: ['What research methodology was used?', 'How was this system developed?', 'What research design was used in the thesis?', 'How was data collected for this research?'],
    answer: `**Research Methodology (Chapter 3)**

- **Research Design:** Applied Software Engineering Research Design with 4 phases:
  1. Problem Analysis — Identified deposit fraud and information asymmetry in Kigali.
  2. Cryptographic Protocol Design — Designed smart contract escrow architecture.
  3. System Development — Built the dApp using Agile methodology.
  4. Deployment and Evaluation — Tested and validated the system.

- **Sampling:** Purposive sampling of 15 participants (5 landlords, 5 tenants, 5 brokers) in Kigali.

- **Data Collection:** Semi-structured interviews + document review of Rwandan tenancy agreements.

- **Data Analysis:** Thematic Analysis for interviews; Content Analysis for legal documents.

- **Development Methodology:** Agile Software Development using Next.js 14 (TypeScript), Express.js, MySQL/Prisma, Solidity/Hardhat.

- **Validation:** Hardhat automated unit testing against 15 test scenarios with zero false-positive state transitions.

- **Ethical Considerations:** Informed consent, confidentiality/anonymity of participants.`,
    priority: 7,
  },
  {
    id: 'thesis-system-architecture',
    category: 'thesis',
    keywords: ['architecture', 'three-tier', 'web3', 'hybrid', 'off-chain', 'on-chain', 'system design', 'tech stack', 'prisma', 'next.js', 'express'],
    questions: ['What is the system architecture?', 'How does the three-tier architecture work?', 'Explain the hybrid Web3 architecture', 'What technology stack was used?'],
    answer: `**System Architecture (Three-Tier Web3)**

**1. Presentation Layer (Frontend)**
- Next.js 14 (React 18, TypeScript) — web application
- Tailwind CSS — styling
- Leaflet/OpenStreetMap — property maps
- ethers.js v6 — blockchain interaction
- PWA (service worker + manifest) — offline support

**2. Middleware Layer (Backend)**
- Express.js 4.18 (TypeScript 5.3) — REST API
- Prisma ORM — database access (27 models)
- JWT authentication (15min access / 7d refresh)
- RBAC (ADMIN, OWNER, TENANT roles)
- 2FA/TOTP security
- Zod validation + rate limiting
- 6 fraud detection rules
- Sentry error monitoring

**3. Blockchain Backend**
- Solidity smart contracts on Hardhat localhost
- 3 contracts: RealEstateEscrow, PropertyDeedNFT (ERC-721), DAOGovernance
- Ethereum network (local Hardhat, deployable to Sepolia testnet)
- Event-driven architecture (~2s state convergence)

**Off-Chain:** MySQL 8.0 database with 27 Prisma models for users, properties, bookings, messages, reviews, notifications, KYC documents, etc.
**On-Chain:** Smart contracts for escrow, NFT property deeds, and governance.`,
    priority: 7,
  },
  {
    id: 'thesis-results',
    category: 'thesis',
    keywords: ['results', 'findings', 'testing', 'validation', 'r-squared', 'gas costs', 'test results', 'performance'],
    questions: ['What were the results and findings?', 'Did the thesis achieve its objectives?', 'What were the test results?', 'How was the system validated?'],
    answer: `**Results and Findings (Chapter 5)**

✓ **All objectives achieved.** All components operational with zero TypeScript errors and on-chain escrow verification.

**Key Metrics:**
- **Smart Contracts:** RealEstateEscrow (393 lines, 8 functions), PropertyDeedNFT (ERC-721), DAOGovernance
- **Gas Costs:** createBooking ~89K, confirmHandover ~32K, cancelBooking ~28K, timeout ~25K, dispute ~24K, resolveDispute ~30K
- **API Surface:** 15 modules, 80+ endpoints (Auth, Properties, Bookings, Payments, Notifications, 2FA, KYC, Wishlist, Search, Messaging, AI Chat, Admin, etc.)
- **Database:** 27 Prisma models, 40+ properties across 3 districts
- **Code Quality:** Backend — 0 TypeScript errors; Frontend — 0 TypeScript errors
- **Testing:** 15 Hardhat test scenarios with zero false-positive state transitions
- **Security:** Multi-layered (JWT, RBAC, 2FA, Zod, rate limiting, fraud detection, ReentrancyGuard, Pausable)
- **Payment Methods:** 3 methods — Ethereum direct, MTN MoMo fiat-to-ETH bridge, Card fiat-to-ETH bridge`,
    priority: 7,
  },
  {
    id: 'thesis-discussion',
    category: 'thesis',
    keywords: ['discussion', 'limitations', 'challenges', 'weaknesses', 'strengths', 'implications', 'comparison', 'literature', 'what are the limitations', 'system limitations', 'weakness of the system', 'what are the weaknesses'],
    questions: ['What are the limitations of this system?', 'What challenges were encountered?', 'How does this compare to existing research?', 'What are the strengths of this system?'],
    answer: `**Discussion Summary (Chapter 6)**

**Strengths:**
- Mathematical fraud elimination through smart contract escrow
- Multi-signature handover prevents unilateral fund access
- Dual-platform (web + mobile via Flutter)
- OpenZeppelin security patterns (ReentrancyGuard, Pausable)
- Event-driven architecture (~2s state convergence)
- Gas-optimized functions

**Weaknesses & Limitations:**
1. Local Hardhat only (not deployed to public testnet Sepolia)
2. Manual UI confirmation risk — users must verify on-chain
3. Crypto adoption barrier — requires MetaMask and ETH
4. Internet dependency — no offline mode for transactions
5. Single admin dispute resolution (centralization risk)
6. No formal TAM (Technology Acceptance Model) study conducted
7. Sample size constraints (15 participants)

**Comparison with Literature:**
- Aligns with Tapscott & Tapscott (2016) on blockchain disintermediation
- Supports Christidis & Devetsikiotis (2016) on smart contract escrow
- Extends Karamitsos et al. (2018) — 40% faster lease transactions
- Confirms Mugisha & Nsabimana (2020) — 68% of Kigali tenants experienced deposit disputes

**Challenges Solved:**
- Smart contract race conditions → fixed with ReentrancyGuard + internal _releaseFunds
- Cross-platform state sync → solved with event-driven architecture`,
    priority: 6,
  },
  {
    id: 'thesis-recommendations',
    category: 'thesis',
    keywords: ['recommendations', 'future work', 'policy', 'research', 'minict', 'rha', 'layer 2', 'oracles', 'iot', 'momo', 'stablecoin'],
    questions: ['What are the recommendations from this thesis?', 'What future research is suggested?', 'What policy recommendations were made?', 'How can this system be improved?'],
    answer: `**Recommendations (Chapter 7)**

**For Action / Policy:**
1. **MINICT & RHA** should create a legal sandbox for smart contract-based rental escrow in Rwanda.
2. **Local PropTech startups** should integrate the escrow protocol into their platforms.

**For Future Research:**
1. **Local Fiat On-Ramps** — Develop an MTN MoMo to stablecoin bridge for users without crypto. This would eliminate the crypto adoption barrier.
2. **Layer-2 Scaling** — Deploy on Polygon or Arbitrum to reduce gas costs further below the current ~89K gas per booking.
3. **Decentralized Oracles + IoT** — Integrate IoT smart locks with decentralized oracles (e.g., Chainlink) for automated physical handover verification. This removes the manual UI confirmation step entirely.

**Broader Impact:**
The architecture is not limited to real estate. It's generalizable to other peer-to-peer transaction markets such as vehicle rentals, equipment leasing, and gig economy escrow services.`,
    priority: 7,
  },
  {
    id: 'thesis-smart-contract-details',
    category: 'thesis',
    keywords: ['smart contract details', 'solidity code', 'realestateescrow', 'propertydeednft', 'daogovernance', 'contract functions', 'nft', 'erc-721', 'governance'],
    questions: ['What smart contracts were created?', 'Tell me about the PropertyDeedNFT', 'What is the DAOGovernance contract?', 'How many smart contract functions are there?', 'What is the RealEstateEscrow contract?'],
    answer: `**Three Smart Contracts Deployed**

**1. RealEstateEscrow.sol (393 lines)**
Core escrow contract with 8 functions:
- \`createBooking\` — Tenant initiates booking with deposit (~89K gas)
- \`confirmHandover\` — Both parties sign off to release funds (~32K gas)
- \`cancelBooking\` — Cancel before handover for refund (~28K gas)
- \`raiseDispute\` — Either party flags an issue (~24K gas)
- \`resolveDispute\` — Admin resolves the dispute (~30K gas)
- \`refundTenant\` — Force refund in dispute cases
- \`getBooking\` — View booking details
- \`getBookingCount\` — Total bookings count
- 6 escrow states: Created → Locked → Completed / Refunded / Cancelled / Disputed
- 2.5% platform fee
- Address: \`0x5FbDB2315678afecb367f032d93F642f64180aa3\`

**2. PropertyDeedNFT.sol (ERC-721)**
NFT-based property deed tokens:
- \`mintDeed\` — Mint a property deed as an NFT
- \`transferDeed\` — Transfer ownership
- \`revokeDeed\` — Revoke a deed
- \`getDeedDetails\` — View deed metadata
- \`verifyOwnership\` — Verify current owner
- Address: \`0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512\`

**3. DAOGovernance.sol**
Decentralized governance framework for platform voting and parameter changes.
- Address: \`0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0\``,
    priority: 6,
  },
  {
    id: 'thesis-objectives',
    category: 'thesis',
    keywords: ['objectives', 'research objectives', 'goal', 'aim', 'purpose', 'general objective', 'specific objectives'],
    questions: ['What were the research objectives?', 'What did this thesis aim to achieve?', 'What were the specific objectives of the study?'],
    answer: `**Research Objectives (Chapter 1)**

**General Objective:** To develop a decentralized real estate booking system using smart contracts for the Kigali rental market.

**Specific Objectives:**
1. **Analyse vulnerabilities** in the existing informal rental intermediation system in Kigali — identified deposit fraud, ghost listings, and information asymmetry as key issues.
2. **Design a smart contract escrow architecture** tailored to the Rwandan rental context — created a 6-state escrow with multi-signature handover.
3. **Build a user-friendly decentralized application (dApp)** with both web (Next.js 14) and mobile (Flutter) interfaces using account abstraction for non-technical users.
4. **Evaluate the effectiveness** of the smart contract escrow system through Hardhat testing — 15 test scenarios with zero false-positive state transitions.

All four objectives were achieved.`,
    priority: 6,
  },
  {
    id: 'thesis-literature-review',
    category: 'thesis',
    keywords: ['literature review', 'agency theory', 'transaction cost economics', 'tce', 'principal-agent', 'tapscott', 'christidis', 'karamitsos', 'mugisha', 'nsabimana'],
    questions: ['What theories were used in the literature review?', 'What is Agency Theory in this context?', 'What is Transaction Cost Economics?', 'What existing research was reviewed?'],
    answer: `**Literature Review Summary (Chapter 2)**

**Key Theories:**
1. **Agency Theory (Principal-Agent Problem)** — In traditional real estate, the broker (agent) acts on behalf of the tenant/landlord (principal) but has self-interest. This leads to information asymmetry and fraud. The smart contract removes the human agent, encoding trust in code.
2. **Transaction Cost Economics (TCE)** — Automated smart contract enforcement reduces transaction costs (search, negotiation, enforcement) compared to manual intermediation.

**Empirical Review:**
- **Global:** Tapscott & Tapscott (2016) — blockchain enables disintermediation. Christidis & Devetsikiotis (2016) — smart contracts as escrow mechanisms. Karamitsos et al. (2018) — 40% faster lease transactions with smart contracts, but UX barriers remain.
- **Local:** Mugisha & Nsabimana (2020) — information asymmetry in Kigali, Abakomisiyoneri inflate costs. Confirmed that 68% of Kigali tenants experienced deposit disputes.

**Novelty:** This thesis is the first localized decentralized escrow dApp specifically designed for the Rwandan informal rental market.`,
    priority: 5,
  },
  {
    id: 'thesis-payment-flows',
    category: 'thesis',
    keywords: ['payment', 'payment methods', 'momo', 'mtn', 'mobile money', 'card', 'fiat', 'ethereum', 'bridge', 'fiat-to-eth'],
    questions: ['What payment methods are supported?', 'How does the MTN MoMo bridge work?', 'Can I pay with mobile money?', 'What is the fiat-to-ETH bridge?'],
    answer: `**Three Payment Methods (from the thesis)**

1. **Ethereum Direct Deposit** — Tenant connects MetaMask and deposits ETH directly into the smart contract escrow. The standard blockchain path.

2. **MTN MoMo Fiat-to-ETH Bridge** — Users without crypto can pay via MTN Mobile Money. The backend converts the fiat to ETH and deposits it into the escrow contract on behalf of the user. This bridges the crypto adoption gap.

3. **Card Fiat-to-ETH Bridge** — Similar to MoMo, but using card payments (Visa/Mastercard). Fiat is converted to ETH and deposited into escrow.

All three methods result in ETH locked in the smart contract escrow. The user doesn't need to understand the underlying blockchain — the abstraction layer handles it.`,
    priority: 6,
  },
  {
    id: 'thesis-security',
    category: 'thesis',
    keywords: ['security', 'security architecture', 'fraud detection', 'rbac', '2fa', 'jwt', 'rate limiting', 'reentrancy', 'pausable'],
    questions: ['What security measures are implemented?', 'How is fraud detected?', 'What is the security architecture?', 'How are smart contracts secured?'],
    answer: `**Security Architecture (Multi-Layered)**

**Layer 1 — Authentication & Authorization:**
- JWT with 15-minute access tokens and 7-day refresh tokens
- RBAC (ADMIN, OWNER, TENANT roles)
- 2FA / TOTP support
- Zod input validation

**Layer 2 — Access Control:**
- Rate limiting on all API endpoints
- CORS protection

**Layer 3 — Fraud Detection (6 rules, runs hourly):**
1. Rapid booking from same IP
2. Multiple accounts, same device
3. Abnormal booking patterns
4. Payment anomalies
5. Identity mismatch detection
6. Review manipulation detection

**Layer 4 — Smart Contract Security:**
- OpenZeppelin's ReentrancyGuard — prevents reentrancy attacks
- OpenZeppelin's Pausable — emergency stop mechanism
- Internal \`_releaseFunds\` function ensures atomic state transitions
- 6-state escrow prevents invalid state transitions
- 15 test scenarios with zero false-positive results

**Layer 5 — Monitoring:**
- Sentry error tracking
- Background jobs: booking timeout (every 15 min), timeout warnings (daily 09:00), fraud detection (hourly)`,
    priority: 6,
  },
  {
    id: 'thesis-legal',
    category: 'thesis',
    keywords: ['legal', 'rwanda', 'electronic messages act', 'e-signature', 'regulatory', 'minict', 'rha', 'smart rwanda', 'nst1', 'vision 2050'],
    questions: ['What is the legal basis for smart contracts in Rwanda?', 'Does Rwandan law recognize smart contracts?', 'What regulations apply?', "How does this align with Rwanda's national strategy?"],
    answer: `**Legal and Regulatory Context**

- **Rwanda Electronic Messages Act (2010)** — Legally recognizes electronic messages, records, and signatures. Smart contracts signed with private keys fall under this framework, giving them legal enforceability in Rwanda.

- **Alignment with National Strategies:**
  - **Rwanda Vision 2050** — Aims for a high-income, technology-driven economy.
  - **NST1 (National Strategy for Transformation)** — Digital transformation pillar.
  - **Smart Rwanda Master Plan** — ICT-driven governance and economic development.
  - **SDG 11** — Sustainable cities and communities.

- **Regulatory Bodies:**
  - **MINICT** — Ministry of ICT and Innovation
  - **RHA** — Rwanda Housing Authority

The thesis recommends that MINICT and RHA create a legal sandbox for smart contract-based rental escrow to accelerate adoption.`,
    priority: 5,
  },
];

export default KNOWLEDGE_BASE;
