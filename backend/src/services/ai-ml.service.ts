import { prisma } from '../config/database';
import { env } from '../config/env';

// Local Ollama client (OpenAI-compatible API)
let ollamaClient: any = null;

if (env.OLLAMA_ENABLED) {
  try {
    // Using fetch API for Ollama compatibility
    ollamaClient = {
      baseURL: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL,
    };
    console.log(`[AI] Ollama initialized: ${env.OLLAMA_MODEL} at ${env.OLLAMA_BASE_URL}`);
  } catch (error) {
    console.error('[AI] Failed to initialize Ollama:', error);
  }
}

// ── Local AI helpers (no external API needed) ─────────────────────────────

function localPriceMultiplier(bedrooms: number, bathrooms: number, area: number, amenities: string[]): number {
  let multiplier = 1.0;
  if (bedrooms >= 4) multiplier += 0.15;
  else if (bedrooms >= 3) multiplier += 0.08;
  if (bathrooms >= 3) multiplier += 0.05;
  if (area > 150) multiplier += 0.10;
  else if (area > 100) multiplier += 0.05;
  const premiumAmenities = ['pool', 'gym', 'security', 'generator', 'cctv', 'air_conditioning'];
  const premiumCount = amenities.filter(a => premiumAmenities.includes(a)).length;
  multiplier += premiumCount * 0.03;
  return Math.min(Math.max(multiplier, 0.7), 1.5);
}

async function localChatResponse(message: string, context?: {
  userId?: number; propertyId?: number; bookingId?: number;
}): Promise<string> {
  const msg = message.toLowerCase();

  // ── Intent classification ─────────────────────────────────────────────
  type Intent =
    | 'greeting' | 'farewell' | 'thanks' | 'help' | 'casual'
    | 'neighborhood' | 'booking_process' | 'pricing' | 'payment'
    | 'kyc' | 'dispute' | 'wallet' | 'search' | 'cancel'
    | 'escrow' | 'admin_approval' | 'contact' | 'review'
    | 'wishlist' | 'register' | 'security' | 'maintenance'
    | 'commission' | 'notification' | 'promo' | 'property_types'
    | 'handover' | 'modify_dates' | 'blockchain' | 'language';

  function classify(): Intent[] {
    const intents: Intent[] = [];
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)\b/.test(msg)) intents.push('greeting');
    if (/\b(bye|goodbye|see you|farewell|talk later|catch you)\b/.test(msg)) intents.push('farewell');
    if (/\b(thank|thanks|appreciate|grateful|thx|ty)\b/.test(msg)) intents.push('thanks');
    if (/\b(help|what can you|capabilities|feature|what do you)\b/.test(msg)) intents.push('help');
    if (/\b(how are you|how('s| is) it going|how do you do|how are things|you doing|sup|wassup|what('s| is) up|how you)\b/.test(msg)) intents.push('casual');
    if (/^(yes|yeah|yep|sure|ok|okay|alright|great|good|nice|cool|awesome|fine|perfect|amazing|lovely)\b/.test(msg)) intents.push('casual');
    if (/^(no|nah|nope|not really|not yet)\b/.test(msg)) intents.push('casual');
    if (/^(how|what|why|when|where|who|which)\b/.test(msg) && msg.split(' ').length <= 3) intents.push('casual');
    if (/^(lol|haha|😂|😊|👍|🙏|😁|cool|nice|great)\b/.test(msg)) intents.push('casual');
    if (msg.split(' ').length <= 2 && intents.length === 0) intents.push('casual');
    if (/\b(neighbor|district|area|where|kacyiru|kimihurura|remera|kicukiro|nyarugenge|gasabo|nyamirambo)\b/.test(msg)) intents.push('neighborhood');
    if (/\b(how (to|do (i|we)|can (i|we))|process|step|guide|walk me|tutorial)\b/.test(msg) || /\b(book|booking|reserve|rent)\b/.test(msg)) intents.push('booking_process');
    if (/\b(price|cost|eth|rwf|usd|fee|cheap|expensive|budget|afford)\b/.test(msg)) intents.push('pricing');
    if (/\b(payment|pay|momo|mobile money|card|credit|debit|visa|mastercard)\b/.test(msg)) intents.push('payment');
    if (/\b(kyc|verify|verification|identity|id card|passport|selfie|document)\b/.test(msg)) intents.push('kyc');
    if (/\b(dispute|problem|issue|complaint|refund|report)\b/.test(msg)) intents.push('dispute');
    if (/\b(wallet|metamask|crypto|blockchain|ether|ethereum|gas)\b/.test(msg)) intents.push('wallet');
    if (/\b(find|search|look|browse|available property|show me|recommend|suggest)\b/.test(msg)) intents.push('search');
    if (/\b(cancel|modify|change|reschedule|update.*date|extend)\b/.test(msg)) intents.push('cancel');
    if (/\b(escrow|smart contract|deposit|held|lock|fund)\b/.test(msg)) intents.push('escrow');
    if (/\b(admin|approve|review|pending|reject)\b/.test(msg)) intents.push('admin_approval');
    if (/\b(contact|support|email|phone|call|reach|talk to|agent|human)\b/.test(msg)) intents.push('contact');
    if (/\b(review|rating|rate|feedback|testimonial|comment)\b/.test(msg)) intents.push('review');
    if (/\b(wishlist|favorite|save|bookmark|like)\b/.test(msg)) intents.push('wishlist');
    if (/\b(register|sign.?up|create account|login|log.?in|password|forgot)\b/.test(msg)) intents.push('register');
    if (/\b(secure|safe|trust|fraud|scam|protect|privacy|data)\b/.test(msg)) intents.push('security');
    if (/\b(maintenance|repair|fix|broken|issue.*(property|unit|house|apartment)|plumber|electrician)\b/.test(msg)) intents.push('maintenance');
    if (/\b(commission|fee.*owner|owner.*fee|platform fee|service charge)\b/.test(msg)) intents.push('commission');
    if (/\b(notification|alert|email|sms|remind)\b/.test(msg)) intents.push('notification');
    if (/\b(promo|promotion|discount|coupon|voucher|offer|deal|special)\b/.test(msg)) intents.push('promo');
    if (/\b(studio|apartment|house|villa|bedroom|bathroom|type|size|sqm|area)\b/.test(msg)) intents.push('property_types');
    if (/\b(handover|move.?in|check.?in|key|possession)\b/.test(msg)) intents.push('handover');
    if (/\b(modify|change.*date|reschedule|extend|shorten)\b/.test(msg) && /\b(date|booking|period)\b/.test(msg)) intents.push('modify_dates');
    if (/\b(blockchain|smart contract|on.?chain|transaction|tx|hash)\b/.test(msg)) intents.push('blockchain');
    if (/\b(language|translate|kinyarwanda|french|swahili|translation)\b/.test(msg)) intents.push('language');
    if (intents.length === 0) intents.push('help');
    return intents;
  }

  // ── DB helpers ────────────────────────────────────────────────────────
  async function propertyCount(district?: string): Promise<number> {
    const where: any = { status: 'AVAILABLE', isApproved: true };
    if (district) where.district = { contains: district };
    return prisma.property.count({ where });
  }

  async function userRole(userId?: number): Promise<string | null> {
    if (!userId) return null;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, name: true } });
    return u ? `${u.name} (${u.role})` : null;
  }

  // ── Response builders ─────────────────────────────────────────────────
  const intents = classify();

  async function buildResponse(): Promise<string> {
    for (const intent of intents) {
      switch (intent) {
        case 'greeting': {
          const role = context?.userId ? await userRole(context.userId) : null;
          const name = role?.split('(')[0].trim() || 'there';
          return `Hello ${name}! 👋 Welcome to Kigali Real Estate. I can help you find properties, explain the booking process, answer questions about payments, or anything else. What would you like to know?`;
        }
        case 'farewell':
          return 'Goodbye! 👋 Feel free to come back anytime if you have more questions about Kigali Real Estate.';
        case 'thanks':
          return "You're welcome! 😊 If you have any other questions, I'm here to help. Just ask!";
        case 'help':
          return `I can help you with:\n\n🏙️ **Neighborhoods** — Best areas in Kigali for your needs\n📋 **Booking Process** — Step-by-step guide\n💰 **Pricing** — ETH, USD, RWF costs\n💳 **Payments** — ETH, MoMo, Card details\n🪪 **KYC** — Verification requirements\n⚖️ **Disputes** — How to raise and resolve\n🔐 **Wallet** — MetaMask setup\n🏠 **Property Search** — Find your ideal home\n🔍 **Cancellations** — Modify or cancel bookings\n\nWhat would you like to explore?`;
        case 'casual': {
          const casuals = [
            "Hey there! 😊 I'm doing great, thanks for asking! How can I help you with Kigali Real Estate today?",
            "Doing well! 👋 What can I help you with? Looking for a property or have a question about bookings?",
            "I'm great, thanks! 🌟 Ready to help you find the perfect place in Kigali. What are you looking for?",
            "All good here! 🏠 Have you checked out our property listings? There are some great options available right now.",
          ];
          const userInfo = context?.userId ? await userRole(context.userId) : null;
          const totalProps = await propertyCount();
          if (/^(yes|yeah|yep|sure|ok|okay|alright)\b/.test(msg)) {
            return `Great! 👍 What would you like to do?\n\n   🏠 **Browse properties** — Head to the Properties page\n   💬 **Ask me anything** — Just type your question\n   🔍 **Search** — Try "show me apartments in Gasabo"\n\n📊 Currently **${totalProps} properties available** across Kigali.${userInfo ? `\n👤 You're logged in as **${userInfo}**.` : ''}`;
          }
          if (/^(no|nah|nope|not really|not yet)\b/.test(msg)) {
            return `No problem! 😊 If you ever need help, I'm here. You can ask me about:\n\n   🏙️ Neighborhoods & districts\n   📋 Booking process & steps\n   💰 Pricing & payments\n   🔐 Wallet & escrow\n\nJust type your question anytime!`;
          }
          const name = userInfo?.split('(')[0].trim() || '';
          const greeting = name ? `Hey ${name}! ` : '';
          return `${greeting}${casuals[Math.floor(Math.random() * casuals.length)]}`;
        }
        case 'neighborhood': {
          const gasaboCount = await propertyCount('Gasabo');
          const kicukiroCount = await propertyCount('Kicukiro');
          const nyarugengeCount = await propertyCount('Nyarugenge');
          const total = await propertyCount();
          return `🏙️ **Kigali Neighborhoods**\n\n📍 **Gasabo** (Kacyiru, Kimihurura, Remera)\n   Upscale area near embassies & offices. ${gasaboCount} properties available.\n   _Best for: Professionals, families seeking premium locations_\n\n📍 **Kicukiro** (Gikondo, Niboye)\n   Modern area with good transport links. ${kicukiroCount} properties available.\n   _Best for: Mid-range budget, good balance_\n\n📍 **Nyarugenge** (Nyamirambo, CBD)\n   Vibrant, most affordable. ${nyarugengeCount} properties available.\n   _Best for: Budget-conscious, local culture enthusiasts_\n\n📊 **Total listings across Kigali: ${total}**\n\n💡 _Tip: Use the search bar with filters to find specific properties in any district._`;
        }
        case 'booking_process':
          return `📋 **Booking Process — Step by Step**\n\n1️⃣ **Browse** — Find a property you like from the listings\n2️⃣ **Select Dates** — Choose move-in and move-out dates\n3️⃣ **Book** — Click "Book Now" (requires TENANT role)\n4️⃣ **Pay Deposit** — Choose your method:\n   • ⟠ **Ethereum (ETH)** via MetaMask\n   • 📱 **Mobile Money (MoMo)**\n   • 💳 **Card** (Visa/Mastercard)\n5️⃣ **Escrow** — Your deposit is locked in a blockchain smart contract\n6️⃣ **Handover** — Both you and the owner confirm → funds released to owner\n\n✅ **The entire process is secured by blockchain escrow.**\n\n_Note: You need to complete KYC verification before booking._`;
        case 'pricing': {
          const total = await propertyCount();
          const allPrices = await prisma.property.findMany({
            where: { status: 'AVAILABLE', isApproved: true },
            select: { priceEth: true, district: true },
          });
          const prices = allPrices.map(p => Number(p.priceEth));
          const avg = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(3) : '0';
          const min = prices.length ? Math.min(...prices).toFixed(3) : '0';
          const max = prices.length ? Math.max(...prices).toFixed(3) : '0';
          return `💰 **Pricing Overview**\n\n📊 **Market Range (${total} available properties)**\n   • Min: **${min} ETH/month** (~$${(Number(min) * 2500).toLocaleString()})\n   • Avg: **${avg} ETH/month** (~$${(Number(avg) * 2500).toLocaleString()})\n   • Max: **${max} ETH/month** (~$${(Number(max) * 2500).toLocaleString()})\n\n🏠 **Typical Ranges by Type**\n   • Studio/1BR — 0.1–0.25 ETH/month ($250–625)\n   • 2BR Apartment — 0.25–0.5 ETH/month ($625–1,250)\n   • 3BR House — 0.5–1.0 ETH/month ($1,250–2,500)\n   • Luxury Villa — 1.0–3.0+ ETH/month ($2,500–7,500)\n\n💱 **Exchange Rates (approx)**\n   • 1 ETH ≈ $2,500 USD\n   • 1 USD ≈ 1,250 RWF\n   • 1 ETH ≈ 3,125,000 RWF\n\n💡 _Use the "AI Price Prediction" feature on property pages for personalized estimates._`;
        }
        case 'payment':
          return `💳 **Payment Methods**\n\n⟠ **1. Ethereum (ETH)**\n   • Direct blockchain deposit via MetaMask\n   • Funds locked in smart contract escrow\n   • Full transaction transparency on-chain\n   • _Requires MetaMask with Hardhat Local network_\n\n📱 **2. Mobile Money (MoMo)**\n   • Pay in RWF via MTN MoMo\n   • Backend auto-submits escrow on your behalf\n   • No crypto wallet needed\n   • _Available for users in Rwanda_\n\n💳 **3. Card (Visa/Mastercard)**\n   • Pay in USD\n   • Same automatic escrow submission\n   • No crypto knowledge required\n\n✅ **All methods result in a real blockchain transaction** for maximum trust and transparency.`;
        case 'kyc':
          return `🪪 **KYC Verification**\n\n_Know Your Customer — required before booking_\n\n**📋 What you need to submit:**\n   • National ID (front & back) or Passport\n   • Selfie / Portrait photo\n\n**⏱️ Timeline:**\n   • Submitted → **PENDING_REVIEW**\n   • Admin reviews within **24 hours**\n   • Approved → you can book any property\n   • Rejected → you'll get a reason and can re-submit\n\n**How to submit:**\n   Dashboard → KYC Verification → Upload documents\n\n⚠️ _KYC is mandatory for all TENANT accounts before booking._`;
        case 'dispute':
          return `⚖️ **Dispute Resolution**\n\n**How to raise a dispute:**\n   1. Go to your **Booking Detail** page\n   2. Click **"Raise Dispute"**\n   3. Provide details explaining the issue\n\n**What happens next:**\n   • Admin team reviews within **48 hours**\n   • Funds remain **locked in escrow** until resolved\n   • All evidence recorded **on the blockchain**\n   • Both parties can provide evidence\n\n**Common dispute reasons:**\n   • Property condition not as described\n   • Owner didn't hand over property\n   • Tenant didn't move in on time\n   • Deposit refund issues\n\n📩 _For urgent issues, use the Messages feature to contact support._`;
        case 'wallet':
          return `🔐 **MetaMask Wallet Setup**\n\n**For ETH payments on local test network:**\n\n1️⃣ Install **MetaMask** browser extension\n2️⃣ Add custom network:\n   • RPC URL: \`http://127.0.0.1:8545\`\n   • Chain ID: \`31337\`\n   • Currency: \`ETH\`\n   • Name: \`Hardhat Local\`\n3️⃣ Import a test account:\n   • Private key: \`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\`\n   • This account has **10,000 test ETH**\n4️⃣ You can now pay deposits directly from MetaMask\n\n💡 _Don't have MetaMask? Use MoMo or Card instead — no wallet needed!_`;
        case 'search':
          return `🔍 **Finding Properties**\n\n**Ways to search:**\n   • **Browse all** — Visit the Properties page\n   • **Filters** — Filter by district, price, bedrooms, bathrooms, amenities\n   • **Smart Search** — Use natural language like "3-bedroom in Gasabo under 0.5 ETH"\n   • **Wishlist** — Save favorites for later comparison\n\n**💡 Tips:**\n   • Use the **AI Smart Search** feature for natural language queries\n   • Check property details for photos, amenities, and virtual tours\n   • Read reviews from previous tenants\n   • Contact the owner directly via the Messages feature\n\n_Need recommendations? Tell me what you're looking for (district, budget, bedrooms) and I can suggest options!_`;
        case 'cancel':
          return `🔄 **Modifications & Cancellations**\n\n**Before handover:**\n   • You can **cancel** a booking — deposit is refunded (minus any fees)\n   • You can **modify dates** — if the property is available for new dates\n\n**After handover:**\n   • Standard cancellation policy applies\n   • Both parties must agree to early termination\n   • Disputes go through the resolution process\n\n**How to cancel/modify:**\n   1. Go to **Dashboard → My Bookings**\n   2. Click on the booking\n   3. Choose **Cancel Booking** or **Modify Dates**\n\n⚠️ _Funds held in escrow are only released after both parties confirm or a dispute is resolved._`;
        case 'escrow':
          return `🔒 **Blockchain Escrow System**\n\n**How escrow works:**\n   1. You pay the **deposit** (ETH/MoMo/Card)\n   2. Funds are sent to a **smart contract** on the blockchain\n   3. Neither party can access the funds alone\n   4. When both confirm **handover** → funds released to owner\n   5. If **dispute** → admin reviews, funds released accordingly\n\n**Benefits:**\n   ✅ **Trustless** — No need to trust the other party\n   ✅ **Transparent** — All transactions on public blockchain\n   ✅ **Secure** — Funds can't be stolen or misused\n   ✅ **Automated** — Smart contract enforces rules\n\n_Contract address: ${env.CONTRACT_ADDRESS || 'Deployed on Hardhat local network'}_`;
        case 'admin_approval':
           return `✅ **Property Approval Process**\n\n**For owners:**\n   1. List your property (becomes **PENDING**)\n   2. Upload **at least one** of the accepted documents\n   3. Admin reviews documents and property details\n   4. Once approved → property appears in search results\n\n**Accepted documents (upload at least one):**\n   • **UPI** — Unique Parcel Identifier\n   • **Land Title** — Proof of ownership\n   • **Land Certificate** — Official registration\n   • **Certificate of Land Registration** — Government-issued\n\n**⏱️ Review time:** Typically within 24–48 hours\n\n📩 _Status updates are sent via notifications._`;
        case 'contact':
          return `📞 **Contact & Support**\n\n**Contact options:**\n   • **Messages** — Use the in-app messaging system to contact property owners\n   • **Admin Support** — For account or platform issues\n   • **Email** — support@kigali-re.com (configured in settings)\n\n**Response times:**\n   • Owner messages: usually within a few hours\n   • Admin support: within 24 hours\n   • Dispute resolution: within 48 hours\n\n💡 _For quick answers, keep using the AI assistant — I can help with most questions!_`;
        case 'review':
          return `⭐ **Reviews & Ratings**\n\n**After your booking is complete:**\n   1. Go to your **Booking Detail** page\n   2. Leave a **rating** (1–5 stars)\n   3. Write a **review** about your experience\n\n**What to include in your review:**\n   • Property condition and cleanliness\n   • Location and neighborhood\n   • Communication with the owner\n   • Overall satisfaction\n\n**Owners can reply** to reviews to address any concerns.\n\n💡 _Honest reviews help other tenants make informed decisions!_`;
        case 'wishlist':
          return `❤️ **Wishlist / Favorites**\n\n**How it works:**\n   • Click the **heart icon** on any property to save it\n   • Access your wishlist from the menu: **Wishlist**\n   • Compare saved properties side by side\n\n**Uses:**\n   • Save properties you're interested in\n   • Come back later to book\n   • Get notified when price changes\n\n📱 _Your wishlist is synced across devices when you're logged in._`;
        case 'register':
          return `📝 **Account Management**\n\n**Registration:**\n   • Go to the **Register** page\n   • Choose your role: **TENANT** (rent) or **OWNER** (list properties)\n   • Provide your name, email, and password\n\n**Login:**\n   • Use your email and password\n   • Forgot password? Use the **"Forgot Password"** link\n\n**Roles explained:**\n   • **TENANT** — Browse and book properties\n   • **OWNER** — List properties and manage bookings\n   • **ADMIN** — Review and approve properties, manage disputes\n\n_After logging in, complete your profile and KYC verification._`;
        case 'security':
          return `🔒 **Platform Security**\n\n**How we keep you safe:**\n   • **Blockchain escrow** — Funds are locked in smart contracts, not held by any party\n   • **KYC verification** — All tenants and owners are verified\n   • **Property verification** — All properties are admin-approved with document checks\n   • **Fraud detection** — Automated system monitors suspicious activity\n   • **Encrypted data** — Your personal information is securely stored\n\n**Your responsibilities:**\n   • Never share your password or private keys\n   • Report suspicious listings or users\n   • Use the platform's messaging system (not external) for communication\n\n⚠️ _AI can make mistakes. Always verify important information independently._`;
        case 'maintenance':
          return `🔧 **Maintenance & Repairs**\n\n**During your rental:**\n   • Contact the **owner** directly via the Messages feature\n   • Describe the issue and include photos if possible\n   • Owners are expected to respond within 24 hours\n\n**What's covered:**\n   • Structural issues (leaks, electrical, plumbing)\n   • Appliances included in the rental\n   • General wear and tear\n\n**What's tenant responsibility:**\n   • Minor repairs (light bulbs, basic cleaning)\n   • Damage caused by negligence\n\n💡 _Check the property listing for specific maintenance terms._`;
        case 'commission':
          return `💼 **Fees & Commission**\n\n**For Owners:**\n   • Platform commission is deducted from the rental payment\n   • Commission rate varies based on listing type\n   • Detailed breakdown available in your dashboard\n\n**For Tenants:**\n   • **No platform fees** for booking\n   • You only pay the **security deposit** (held in escrow)\n   • Monthly rent is paid directly to the owner\n\n💡 _All fees are transparently shown before you confirm any transaction._`;
        case 'notification':
          return `🔔 **Notifications**\n\n**You'll receive notifications for:**\n   • Booking confirmations and updates\n   • Payment confirmations\n   • KYC verification status changes\n   • Messages from owners/tenants\n   • Property approval/rejection\n   • Dispute updates\n\n**How to manage:**\n   • Go to **Dashboard → Notifications**\n   • Mark notifications as read\n   • Configure notification preferences\n\n📱 _Enable browser notifications for real-time alerts._`;
        case 'promo':
          return `🎉 **Promotions & Offers**\n\n**Current features:**\n   • **Promo Codes** — Enter a promo code during checkout for discounts\n   • **Special Offers** — Some properties have reduced rates for longer stays\n   • **Referral Program** — Invite friends and earn credits (coming soon)\n\n**How to use a promo code:**\n   1. Select your property and dates\n   2. Click "Book Now"\n   3. Enter the promo code in the payment section\n   4. Discount is applied automatically\n\n💡 _Follow our social media channels for exclusive deals!_`;
        case 'property_types':
          return `🏠 **Property Types**\n\n**Available on our platform:**\n\n• **Studio** — Compact living, ideal for singles (0.1–0.2 ETH/month)\n• **1-Bedroom Apartment** — Separate bedroom, modern living (0.15–0.25 ETH/month)\n• **2-Bedroom Apartment** — Perfect for couples or roommates (0.25–0.5 ETH/month)\n• **3-Bedroom House** — Family-sized with outdoor space (0.5–1.0 ETH/month)\n• **Luxury Villas** — Premium living, pool, garden, security (1.0–3.0+ ETH/month)\n\n**Amenities often include:**\n   WiFi, parking, generator, CCTV, gym, pool, security, air conditioning\n\n💡 _Use the filters on the Properties page to find exactly what you need._`;
        case 'handover':
          return `🔑 **Handover Process**\n\n**After booking and deposit:**\n   1. Both tenant and owner confirm **handover**\n   2. Tenant moves in on the agreed start date\n   3. Escrow funds are released to the owner\n   4. Tenancy period begins\n\n**At the end of tenancy:**\n   1. Both parties confirm **handover completion**\n   2. Owner inspects the property\n   3. Any deposit deductions are agreed upon\n   4. Remaining deposit is returned to tenant\n\n⚠️ _Both parties must confirm for funds to be released. If there's a disagreement, raise a dispute._`;
        case 'modify_dates':
          return `📅 **Modifying Booking Dates**\n\n**You can modify dates if:**\n   • The property is **available** for the new dates\n   • The modification is made **before handover**\n   • Both parties agree to the change\n\n**How to modify:**\n   1. Go to **Dashboard → My Bookings**\n   2. Open the booking detail page\n   3. Click **"Modify Dates"**\n   4. Select new start/end dates\n   5. Confirm the change\n\n⚠️ _If the price differs for the new dates, the escrow amount may be adjusted._`;
        case 'blockchain':
          return `⛓️ **Blockchain Integration**\n\n**Our platform uses blockchain for:**\n   • **Escrow** — Rental deposits locked in smart contracts\n   • **Transactions** — All payments recorded on-chain\n   • **Verification** — Tamper-proof record of agreements\n   • **Disputes** — Evidence stored on blockchain\n\n**Network:** Ethereum-compatible (Hardhat local for development)\n\n**Contract:** RealEstateEscrow — manages deposits, handovers, and disputes\n\n**Benefits:**\n   ✅ Immutable records\n   ✅ No central authority needed\n   ✅ Full transparency\n   ✅ Automated enforcement via smart contracts\n\n_View transaction hashes on your booking detail page._`;
        case 'language':
          return `🌐 **Language / Translation**\n\n**Supported features:**\n   • The platform supports **multiple languages**\n   • Property content can be **translated** using AI\n   • Available languages: English, French, Kinyarwanda, Swahili\n\n**How to translate:**\n   • Use the language selector in the navigation\n   • Property descriptions can be auto-translated\n\n💡 _The AI assistant responds in English. Translation features are being expanded._`;
      }
    }
    // ── Catch-all with DB data ──────────────────────────────────────────
    const totalProps = await propertyCount();
    const userInfo = context?.userId ? await userRole(context.userId) : null;
    return `I'm the Kigali Real Estate assistant. I can help you with a wide range of topics:\n\n🏙️ Neighborhoods & districts\n📋 Booking process & steps\n💰 Pricing (ETH, USD, RWF)\n💳 Payment methods (ETH, MoMo, Card)\n🪪 KYC verification\n⚖️ Disputes & resolution\n🔐 Wallet setup (MetaMask)\n🔒 Blockchain escrow system\n🔄 Cancellations & modifications\n⭐ Reviews & ratings\n🔧 Maintenance & repairs\n\n📊 Currently **${totalProps} properties available** across Kigali.${userInfo ? `\n👤 You're logged in as **${userInfo}**.` : '\n💡 _Log in to book properties and access all features._'}\n\nWhat would you like to know? Just ask!`;
  }

  return buildResponse();
}

function localDescription(details: { title: string; district: string; bedrooms: number; bathrooms: number; amenities: string[]; nearbyLandmarks?: string[] }): string {
  const amenityList = details.amenities.slice(0, 5).map(a => a.replace(/_/g, ' ')).join(', ');
  const landmarks = details.nearbyLandmarks?.length ? ` Conveniently located near ${details.nearbyLandmarks.slice(0, 2).join(' and ')}.` : '';
  return `${details.title} is a beautifully appointed ${details.bedrooms}-bedroom, ${details.bathrooms}-bathroom residence in the heart of ${details.district}, Kigali. ${amenityList ? `This property features ${amenityList}, ensuring a comfortable and modern lifestyle.` : 'Offering spacious, well-designed living areas.'} Situated in one of Kigali's most desirable neighborhoods, residents enjoy easy access to restaurants, offices, and amenities.${landmarks} Perfect for professionals and families seeking quality accommodation with the security of blockchain-verified rental agreements.`;
}

// ── Ollama API Helper ─────────────────────────────────────────────────────

async function callOllama(messages: any[], temperature = 0.7, maxTokens = 500): Promise<string | null> {
  if (!ollamaClient) return null;

  try {
    const response = await fetch(`${ollamaClient.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaClient.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error(`[Ollama] HTTP ${response.status}`);
      return null;
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('[Ollama] Error:', error);
    return null;
  }
}

// ── OpenAI API Helper ──────────────────────────────────────────────────────

async function callOpenAI(messages: any[], temperature = 0.7, maxTokens = 500): Promise<string | null> {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
    if (!response.ok) {
      console.error(`[OpenAI] HTTP ${response.status}`);
      return null;
    }
    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    return null;
  }
}

// ── Gemini API Helper ───────────────────────────────────────────────────────

async function callGemini(messages: any[], temperature = 0.7, maxTokens = 500): Promise<string | null> {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const model = env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsg = messages.filter(m => m.role !== 'system').map(m => m.content).join('\n');
    const contents = [];
    if (systemMsg) contents.push({ role: 'user', parts: [{ text: `System instruction: ${systemMsg}\n\n${userMsg}` }] });
    else contents.push({ role: 'user', parts: [{ text: userMsg }] });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig: { temperature, maxOutputTokens: maxTokens } }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Gemini] HTTP ${response.status}: ${errText}`);
      return null;
    }
    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('[Gemini] Error:', error);
    return null;
  }
}

// Try providers in order: OpenAI → Gemini → Ollama → null
export async function callAI(messages: any[], temperature = 0.7, maxTokens = 500): Promise<string | null> {
  const fromOpenAI = await callOpenAI(messages, temperature, maxTokens);
  if (fromOpenAI) return fromOpenAI;
  const fromGemini = await callGemini(messages, temperature, maxTokens);
  if (fromGemini) return fromGemini;
  const fromOllama = await callOllama(messages, temperature, maxTokens);
  if (fromOllama) return fromOllama;
  return null;
}

// ── Local explain-contract fallback ────────────────────────────────────────

function localExplainContract(params: {
  depositEth: string;
  depositUsd: string;
  durationDays: number;
  ownerName: string;
  propertyTitle: string;
  language: 'en' | 'rw';
  timeoutDays: number;
}): string {
  const en = `📜 **Smart Contract Summary**

Property: ${params.propertyTitle}
Landlord: ${params.ownerName}
Deposit: ${params.depositEth} ETH (~$${params.depositUsd})
Rental Period: ${params.durationDays} days
Timeout: ${params.timeoutDays} days after move-in

**How Your Deposit is Protected:**

1️⃣ **Deposit Locked** — Your ${params.depositEth} ETH is locked in a blockchain smart contract. Neither you nor the landlord can access it alone.

2️⃣ **Handover Confirmation** — Once you receive the keys and confirm the property is as described, both parties sign off. The deposit is released to the landlord.

3️⃣ **Refund Conditions** — At the end of the rental:
   • If everything is in order → deposit returned to you automatically
   • If there's damage → landlord can claim a portion (must provide evidence)
   • If unresolved → dispute can be raised; admin reviews and decides

4️⃣ **Timeout Protection** — If the landlord doesn't confirm handover within ${params.timeoutDays} days of your move-in, the deposit is automatically refunded to you.

✅ **No one can run away with your money. The smart contract enforces these rules transparently.**`;

  const rw = `📜 **Incamake y'Amasezerano ya Smart Contract**

Aho nyir'izu: ${params.propertyTitle}
Nyir'inzu: ${params.ownerName}
Ingwate: ${params.depositEth} ETH (~$${params.depositUsd})
Igihe cyo gutura: ${params.durationDays} iminsi
Igihe cyo gutegereza: ${params.timeoutDays} iminsi nyuma yo kwinjira

**Uko ingwate yawe irinzwe:**

1️⃣ **Ingwate irafungwa** — ${params.depositEth} ETH yawe irabikwa muri blockchain smart contract. Ntawe ushobora kuyikoresha wenyine.

2️⃣ **Kwemeza kwinjira** — Iyo maze gufata imfunguzo ugahita wemeza ko inzu imeze nk'uko byasezeranyijwe, bombi musinya. Ingwate irekura nyir'inzu.

3️⃣ **Ingwate igaruka ite** — Igihe cyo gutura kirangiye:
   • Niba ibintu byose bimeze neza → ingwate igaruswa ikoresherezwa
   • Niba hari ibyangiritse → nyir'inzu ashobora gusaba igice (agomba gutanga ibimenyetso)
   • Niba hatabonetse umuti → hashobora gutangwa ikibazo; abayobozi bareba maze baffata umwanzuro

4️⃣ **Kwirinda igihe** — Niba nyir'inzu atemeje kwinjiza mu gihe cy'iminsi ${params.timeoutDays} nyuma yo kwinjira, ingwate igaruswa ikoresherezwa.

✅ **Ntawe ushobora gukoresha amafaranga yawe. Smart contract irabirinda.**`;

  return params.language === 'rw' ? rw : en;
}

// ── ESSENTIAL AI FEATURES (3 most important) ──────────────────────────────

/**
 * FEATURE 1: AI CHAT ASSISTANT (Most Used)
 * Helps users with questions about properties, bookings, payments
 */
export class AIChatAssistantService {
  /**
   * AI Legal Assistant — explains booking escrow in plain language
   */
  static async explainContract(params: {
    depositEth: string;
    durationDays: number;
    ownerName: string;
    ownerId: number;
    propertyTitle: string;
    propertyId: number;
    tenantName?: string;
    language: 'en' | 'rw';
    timeoutDays?: number;
  }) {
    const depositUsd = (Number(params.depositEth) * 2500).toFixed(2);
    const timeoutDays = params.timeoutDays || 3;

    // Try AI first
    const systemMsg = params.language === 'rw'
      ? `Uri umunyamurava w'abakozi mu Rwanda. Sobanura amasezerano ya smart contract mu Rwanda. Koresha imvugo yoroheje. TAnga incamake y'amasezerano y'ingwate.`
      : `You are a legal assistant for Kigali Real Estate. Explain the smart contract escrow in plain, friendly language suitable for non-technical users in Kigali. Cover: (1) deposit locked in escrow, (2) handover confirmation releases funds to landlord, (3) refund conditions at end of tenancy, (4) timeout auto-refund if landlord doesn't confirm.`;

    const userMsg = params.language === 'rw'
      ? `Sobanura aya masezerano: Inzu: ${params.propertyTitle}, Nyir'inzu: ${params.ownerName}, Ingwate: ${params.depositEth} ETH (~$${depositUsd}), Igihe: ${params.durationDays} iminsi.`
      : `Explain this booking contract: Property: ${params.propertyTitle}, Landlord: ${params.ownerName}, Deposit: ${params.depositEth} ETH (~$${depositUsd}), Duration: ${params.durationDays} days, Timeout: ${timeoutDays} days. Keep it under 200 words.`;

    const aiResponse = await callAI(
      [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      0.5,
      400
    );

    if (aiResponse) {
      return { explanation: aiResponse, source: 'ai' };
    }

    // Fallback to local template
    return {
      explanation: localExplainContract({
        depositEth: params.depositEth,
        depositUsd,
        durationDays: params.durationDays,
        ownerName: params.ownerName,
        propertyTitle: params.propertyTitle,
        language: params.language,
        timeoutDays,
      }),
      source: 'local',
    };
  }

  /**
   * Kigali RE Copilot — RAG-enhanced chat
   */
  static async chat(userMessage: string, context?: {
    userId?: number;
    propertyId?: number;
    bookingId?: number;
  }) {
    let contextInfo = '';

    if (context?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: context.userId },
        select: { name: true, email: true, role: true },
      });
      if (user) {
        contextInfo += `User: ${user.name} (${user.role})\n`;
      }
    }

    if (context?.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: context.propertyId },
        select: { title: true, description: true, priceEth: true, district: true, status: true },
      });
      if (property) {
        contextInfo += `Viewing: ${property.title} in ${property.district} at ${property.priceEth} ETH (${property.status})\n`;
      }
    }

    // RAG: fetch active listings when user searches for properties
    const lowerMsg = userMessage.toLowerCase();
    const isPropertyQuery = /\b(show|find|search|recommend|suggest|available|looking for|need|want|property|apartment|house|studio|villa|bedroom|rent)\b/.test(lowerMsg);
    if (isPropertyQuery) {
      const listings = await prisma.property.findMany({
        where: { status: 'AVAILABLE', isApproved: true },
        select: { title: true, district: true, priceEth: true, bedrooms: true, bathrooms: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      if (listings.length > 0) {
        contextInfo += `\nAvailable properties (${listings.length} shown):
${listings.map(p => `- ${p.title}, ${p.district}, ${p.bedrooms}br, ${p.priceEth} ETH`).join('\n')}`;
      }
    }

    // RAG: fetch market data when user asks about pricing/trends
    const isMarketQuery = /\b(price|cost|market|trend|avg|average|fair|expensive|cheap|value|worth|compare|how much|budget|affordable)\b/.test(lowerMsg);
    if (isMarketQuery) {
      const allProperties = await prisma.property.findMany({
        where: { status: 'AVAILABLE', isApproved: true },
        select: { district: true, priceEth: true },
      });
      const byDistrict: Record<string, number[]> = {};
      for (const p of allProperties) {
        const price = parseFloat(p.priceEth);
        if (!isNaN(price)) {
          if (!byDistrict[p.district]) byDistrict[p.district] = [];
          byDistrict[p.district].push(price);
        }
      }
      const marketLines = Object.entries(byDistrict).map(([district, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `- ${district}: avg ${avg.toFixed(4)} ETH, range ${min.toFixed(4)}-${max.toFixed(4)} ETH (${prices.length} listings)`;
      });
      if (marketLines.length > 0) {
        contextInfo += `\nMarket overview by district:\n${marketLines.join('\n')}`;
      }

      const recentBookings = await prisma.booking.findMany({
        where: { status: 'COMPLETED' },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      if (recentBookings.length > 0) {
        contextInfo += `\nRecent bookings: ${recentBookings.length} completed in the last period`;
      }
    }

    // Try AI first
    const systemPrompt = `You are the "Kigali RE Copilot" — an AI assistant for Kigali Real Estate Booking Platform. You help users find properties, explain the booking process, and guide them through Web3 features like MetaMask setup and escrow. Be friendly, professional, and concise. Keep responses under 250 words.${contextInfo ? `\n\nCurrent context:\n${contextInfo}` : ''}`;

    const aiResponse = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      0.7,
      400
    );

    if (aiResponse) {
      return { response: aiResponse, fallback: false, source: 'ai' };
    }

    // Fallback to local logic
    const localResponse = await localChatResponse(userMessage, context);
    return { response: localResponse, fallback: true, source: 'local' };
  }

  /**
   * Generate professional property descriptions
   */
  static async generatePropertyDescription(details: {
    title: string;
    district: string;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    nearbyLandmarks?: string[];
  }) {
    if (ollamaClient) {
      try {
        const prompt = `Write a compelling property description (under 150 words) for: ${details.title} in ${details.district}. ${details.bedrooms} bedrooms, ${details.bathrooms} bathrooms. Amenities: ${details.amenities.join(', ')}. ${details.nearbyLandmarks ? `Nearby: ${details.nearbyLandmarks.join(', ')}` : ''}`;

        const response = await callOllama(
          [
            { role: 'system', content: 'You are a professional real estate copywriter. Write compelling, concise property descriptions.' },
            { role: 'user', content: prompt },
          ],
          0.8,
          250
        );

        if (response) return response;
      } catch (error) {
        console.error('[AI Description] Ollama error:', error);
      }
    }

    return localDescription(details);
  }

  /**
   * Translate property content to another language
   */
  static async translatePropertyContent(content: string, targetLanguage: string) {
    if (ollamaClient) {
      try {
        const response = await callOllama(
          [
            { role: 'system', content: `You are a professional translator. Translate to ${targetLanguage}. Maintain professional tone and real estate terminology.` },
            { role: 'user', content: content },
          ],
          0.3,
          500
        );

        if (response) return response;
      } catch (error) {
        console.error('[AI Translation] Ollama error:', error);
      }
    }

    // Fallback: return original with note
    return `[${targetLanguage} translation unavailable]\n\n${content}`;
  }
}

/**
 * FEATURE 2: AI PRICE PREDICTION (Most Important for Owners)
 * Predicts property prices based on comparable properties
 */
export class AIPricePredictionService {
  static async analyzeMarketTrends(district: string) {
    const properties = await prisma.property.findMany({
      where: {
        district,
        status: 'AVAILABLE',
        isApproved: true,
      },
      select: { priceEth: true },
    });

    const recentBookings = await prisma.booking.findMany({
      where: {
        property: { district },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { escrowAmount: true },
    });

    const prices = properties.map(p => Number(p.priceEth));
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const bookingCount = recentBookings.length;
    const totalRevenue = recentBookings.reduce((sum, b) => sum + Number(b.escrowAmount || 0), 0);

    let trend = 'stable';
    let prediction = 'Market conditions are stable';
    
    if (ollamaClient && bookingCount > 5) {
      try {
        const prompt = `District: ${district}. Properties: ${properties.length}. Bookings (30 days): ${bookingCount}. Average price: ${avgPrice.toFixed(4)} ETH. Total revenue: ${totalRevenue.toFixed(4)} ETH. Provide brief market trend analysis under 50 words.`;

        const response = await callOllama(
          [
            { role: 'system', content: 'Analyze real estate market data. Provide brief trend assessment.' },
            { role: 'user', content: prompt }
          ],
          0.5,
          100
        );

        if (response) prediction = response;
      } catch (error) {
        console.error('[AI Market Analysis] Ollama error:', error);
        prediction = `${bookingCount > 10 ? 'High demand' : bookingCount > 5 ? 'Moderate activity' : 'Low activity'} in ${district}. Average price: ${avgPrice.toFixed(4)} ETH.`;
      }
    } else {
      prediction = `${bookingCount > 10 ? 'High demand' : bookingCount > 5 ? 'Moderate activity' : 'Low activity'} in ${district}. Average price: ${avgPrice.toFixed(4)} ETH.`;
    }

    return {
      district,
      avgPrice: avgPrice.toFixed(4),
      minPrice: minPrice.toFixed(4),
      maxPrice: maxPrice.toFixed(4),
      bookingCount,
      totalRevenue: totalRevenue.toFixed(4),
      trend,
      prediction,
      analyzedAt: new Date().toISOString(),
    };
  }

  static async predictPrice(propertyData: {
    district: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    amenities: string[];
    condition?: string;
  }) {
    const comparableProperties = await prisma.property.findMany({
      where: {
        district: propertyData.district,
        status: 'AVAILABLE',
        isApproved: true,
      },
      select: {
        priceEth: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
      },
      take: 20,
    });

    const prices = comparableProperties.map(p => Number(p.priceEth));
    const avgPrice = prices.length > 0 
      ? prices.reduce((a, b) => a + b, 0) / prices.length 
      : 0.5;

    let aiAdjustment = 1.0;
    
    // Try Ollama for AI adjustment
    if (ollamaClient) {
      try {
        const prompt = `Property: ${propertyData.bedrooms} bed, ${propertyData.bathrooms} bath, ${propertyData.area} sqm in ${propertyData.district}. Amenities: ${propertyData.amenities.join(', ')}. Average price in area: ${avgPrice.toFixed(4)} ETH. Return ONLY a number between 0.7 and 1.5 as price multiplier.`;

        const response = await callOllama(
          [
            { role: 'system', content: 'You are a real estate pricing expert. Return ONLY a single number.' },
            { role: 'user', content: prompt },
          ],
          0.3,
          50
        );

        if (response) {
          const parsed = parseFloat(response.trim());
          if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.5) {
            aiAdjustment = parsed;
          }
        }
      } catch (error) {
        console.error('[AI Price] Ollama error:', error);
        aiAdjustment = localPriceMultiplier(propertyData.bedrooms, propertyData.bathrooms, propertyData.area, propertyData.amenities);
      }
    } else {
      aiAdjustment = localPriceMultiplier(propertyData.bedrooms, propertyData.bathrooms, propertyData.area, propertyData.amenities);
    }

    const basePrice = avgPrice * aiAdjustment;
    const bedroomAdjustment = propertyData.bedrooms * 0.05;
    const bathroomAdjustment = propertyData.bathrooms * 0.03;
    const areaAdjustment = (propertyData.area / 100) * 0.1;
    
    const finalPriceEth = basePrice * (1 + bedroomAdjustment + bathroomAdjustment + areaAdjustment);
    
    const ethPriceUsd = 2500;
    const usdToRwf = 1250;
    
    return {
      predictedPriceEth: finalPriceEth.toFixed(4),
      predictedPriceUsd: (finalPriceEth * ethPriceUsd).toFixed(2),
      predictedPriceRwf: (finalPriceEth * ethPriceUsd * usdToRwf).toFixed(0),
      confidence: this.calculateConfidence(comparableProperties.length),
      comparableCount: comparableProperties.length,
      aiAdjusted: aiAdjustment !== 1.0,
      source: ollamaClient ? 'ollama' : 'local',
    };
  }

  private static calculateConfidence(dataPoints: number): number {
    if (dataPoints >= 10) return 0.9;
    if (dataPoints >= 5) return 0.7;
    if (dataPoints >= 1) return 0.5;
    return 0.3;
  }
}

/**
 * FEATURE 3: SMART SEARCH (Most Used for Discovery)
 * Natural language property search
 */
export class SmartSearchService {
  static async naturalLanguageSearch(query: string, userId?: number) {
    let searchFilters: any = {
      status: 'AVAILABLE',
      isApproved: true,
    };

    // Try Ollama to parse natural language
    if (ollamaClient) {
      try {
        const prompt = `Extract search filters from: "${query}". Return JSON with only: district (string), minBedrooms (number), maxPrice (number in ETH), amenities (array). Only include fields mentioned in query.`;

        const response = await callOllama(
          [
            { role: 'system', content: 'Extract search parameters. Return valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          0.2,
          150
        );

        if (response) {
          try {
            const filters = JSON.parse(response);
            if (filters.district) searchFilters.district = filters.district;
            if (filters.minBedrooms) searchFilters.bedrooms = { gte: filters.minBedrooms };
            if (filters.maxPrice) searchFilters.priceEth = { lte: filters.maxPrice.toString() };
            if (filters.amenities?.length > 0) {
              searchFilters.amenities = { hasSome: filters.amenities };
            }
          } catch (e) {
            console.error('[Smart Search] JSON parse error');
          }
        }
      } catch (error) {
        console.error('[Smart Search] Ollama error:', error);
      }
    }

    const properties = await prisma.property.findMany({
      where: searchFilters,
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
      include: {
        owner: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      properties,
      count: properties.length,
      query,
      filters: searchFilters,
      source: ollamaClient ? 'ollama' : 'local',
    };
  }
}

// ── Recommendation Service (Local only - no AI needed) ──────────────────────

export class AIRecommendationService {
  static async getPersonalizedRecommendations(userId: number, limit = 10) {
    const wishlist = await prisma.favorite.findMany({
      where: { userId },
      include: { property: true },
    });

    const bookings = await prisma.booking.findMany({
      where: { tenantId: userId },
      include: { property: true },
    });

    const districts = new Set<string>();
    const priceRanges: number[] = [];

    [...wishlist.map(w => w.property), ...bookings.map(b => b.property)].forEach(prop => {
      if (prop.district) districts.add(prop.district);
      priceRanges.push(Number(prop.priceEth));
    });

    const avgPrice = priceRanges.length > 0 
      ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length 
      : 0;

    const recommendations = await prisma.property.findMany({
      where: {
        status: 'AVAILABLE',
        isApproved: true,
        ownerId: { not: userId },
        OR: [
          { district: { in: Array.from(districts) } },
          {
            AND: [
              { priceEth: { gte: avgPrice.toString() } },
              { priceEth: { lte: (avgPrice * 1.3).toString() } },
            ],
          },
        ],
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const scored = recommendations.map(prop => {
      let score = 0;
      if (districts.has(prop.district)) score += 30;
      const priceDiff = Math.abs(Number(prop.priceEth) - avgPrice) / avgPrice;
      if (priceDiff < 0.3) score += 20;
      return {
        ...prop,
        recommendationScore: score,
      };
    });

    return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }
}
