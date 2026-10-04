import { PrismaClient } from '@prisma/client';
import { TrainingService } from './training.service';
import { tokenize, expandTokens } from './nlp.service';
import { callAI } from './ai-ml.service';

const prisma = new PrismaClient();

/**
 * RAG Service — Retrieval-Augmented Generation using trained model
 */
export class RAGService {
  /**
   * Generate an answer to a user query using:
   * 1. Knowledge base search (trained TF-IDF)
   * 2. Property data retrieval
   * 3. AI fallback (if available)
   */
  static async answer(query: string, context?: { userId?: number; propertyId?: number; bookingId?: number }): Promise<{
    response: string;
    source: 'knowledge_base' | 'property_rag' | 'market_data' | 'ai_fallback' | 'local_fallback';
    confidence: number;
  }> {
    const lower = query.toLowerCase();

    // Phase 1: Search knowledge base (highest confidence)
    const kbResults = TrainingService.searchKnowledgeBase(query, 3);
    if (kbResults.length > 0 && kbResults[0].score > 0.18) {
      return {
        response: kbResults[0].entry.answer,
        source: 'knowledge_base',
        confidence: kbResults[0].score,
      };
    }

    // Phase 2: Property-specific queries
    const propertyMatch = /\b(property|apartment|house|villa|studio|listing|place|room)\b/i.test(lower);
    const isCheapestQuery = /\b(cheap|cheapest|budget|affordable|low|lowest|min|minimum|under)\b/i.test(lower);
    if (propertyMatch || context?.propertyId) {
      const properties = await prisma.property.findMany({
        where: {
          status: 'AVAILABLE',
          isApproved: true,
          ...(context?.propertyId ? { id: context.propertyId } : {}),
        },
        select: {
          title: true, district: true, priceEth: true, bedrooms: true,
          bathrooms: true, area: true, amenities: true, location: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Sort by numeric price if user asked for cheapest
      if (isCheapestQuery) {
        properties.sort((a, b) => parseFloat(a.priceEth) - parseFloat(b.priceEth));
      }

      const top = properties.slice(0, isCheapestQuery ? 10 : 5);

      if (top.length > 0) {
        const listingText = top.map(p => {
          const amens: string[] = Array.isArray(p.amenities) ? p.amenities
            : typeof p.amenities === 'string' ? (() => { try { return JSON.parse(p.amenities); } catch { return []; } })() : [];
          return `• **${p.title}** — ${p.location}, ${p.district}\n  ${p.bedrooms}br/${p.bathrooms}ba, ${p.area || '?'}m²\n  ${p.priceEth} ETH/month\n  ${amens.slice(0, 5).join(', ') || 'No amenities listed'}`;
        }).join('\n\n');

        let intro = '';
        if (context?.propertyId) {
          intro = `Here are the details for this property:\n\n${listingText}`;
        } else if (isCheapestQuery) {
          intro = `Here are the **${top.length} cheapest available properties** (sorted by price):\n\n${listingText}`;
        } else {
          intro = `I found **${top.length}** property/properties that might interest you:\n\n${listingText}`;
        }

        return {
          response: intro + '\n\nWould you like more details on any of these? You can also ask about pricing, amenities, or booking.',
          source: 'property_rag',
          confidence: 0.7,
        };
      }
    }

    // Phase 3: Market data queries
    const marketMatch = /\b(market|price|trend|average|cost|affordable|cheap|expensive|budget)\b/i.test(lower);
    if (marketMatch) {
      const allProperties = await prisma.property.findMany({
        where: { status: 'AVAILABLE', isApproved: true },
        select: { priceEth: true, district: true },
      });

      const byDistrict: Record<string, number[]> = {};
      for (const p of allProperties) {
        const price = parseFloat(p.priceEth);
        if (!isNaN(price)) {
          if (!byDistrict[p.district]) byDistrict[p.district] = [];
          byDistrict[p.district].push(price);
        }
      }

      const districtLines = Object.entries(byDistrict).map(([d, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return `• **${d}**: avg ${avg.toFixed(4)} ETH (${min.toFixed(4)} - ${max.toFixed(4)} ETH, ${prices.length} listings)`;
      });

      // Get prediction for a general property
      const avgBed = 2, avgBath = 2, avgArea = 80;
      const pred = TrainingService.predictPrice({
        bedrooms: avgBed, bathrooms: avgBath, area: avgArea,
        amenities: ['wifi', 'parking'], district: 'Gasabo',
      });

      let response = `**Kigali Market Overview**\n\n${districtLines.join('\n')}\n`;
      if (pred) {
        response += `\n💰 A typical 2-bedroom property in Gasabo is estimated at **${pred.predictedPriceEth.toFixed(4)} ETH/month** (confidence: ${(pred.confidence * 100).toFixed(0)}%).`;
      }
      response += '\n\nUse the AI Price Prediction on any property detail page for a personalized estimate!';

      return {
        response,
        source: 'market_data',
        confidence: 0.7,
      };
    }

    // Phase 4: Try AI fallback (OpenAI/Ollama)
    try {
      const aiResponse = await callAI(
        [
          { role: 'system', content: `You are the "Kigali RE Copilot" — an AI assistant for Kigali Real Estate Booking Platform. You have been trained on the complete thesis "Real Estate Booking System Using Smart Contract: A Case Study of Kigali" by UKUNDAYEZU Hermogene (May 2026). Be friendly, professional, and concise. Keep responses under 200 words. If you don't know something, be honest and suggest where to find help. You can answer thesis-related questions about deposit fraud, smart contract escrow, the booking lifecycle, system architecture, research methodology, results, limitations, and recommendations.` },
          { role: 'user', content: query },
        ],
        0.7,
        300
      );
      if (aiResponse) {
        return { response: aiResponse, source: 'ai_fallback', confidence: 0.5 };
      }
    } catch {
      // Fall through to local fallback
    }

    // Phase 5: Local rule-based fallback
    return {
      response: this.localFallback(query),
      source: 'local_fallback',
      confidence: 0.3,
    };
  }

  /** Local fallback responses for common query patterns */
  private static localFallback(query: string): string {
    const lower = query.toLowerCase().trim();

    if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))/.test(lower)) {
      return `Hello! 👋 Welcome to Kigali RE. I'm the **Kigali RE Copilot**, your AI assistant for the decentralized real estate platform. How can I help you today?`;
    }

    if (/^(thanks|thank you|ty|appreciate)/.test(lower)) {
      return `You're welcome! 😊 Let me know if you need anything else about Kigali RE.`;
    }

    if (/^(bye|goodbye|see you|later|cya)/.test(lower)) {
      return `Goodbye! 👋 Thanks for using Kigali RE. Feel free to come back anytime you need help.`;
    }

    if (/how are you/.test(lower)) {
      return `I'm doing well! 🤖 Ready to help you with anything about Kigali RE. What would you like to know?`;
    }

    if (/what('s| is) (up|new|happening)/.test(lower)) {
      return `All systems are running! 🚀 The platform has properties available across Kigali's three districts. You can browse, book, or ask me anything about how things work.`;
    }

    if (/who (are you|made you|created you)/.test(lower)) {
      return `I'm the **Kigali RE Copilot**! I was built using a custom TypeScript NLP engine with TF-IDF vectorization and gradient descent regression. I'm trained on the complete platform knowledge base and all property data. No external AI APIs required — everything runs locally! 🤖✨`;
    }

    if (/what can you (do|help|tell)/.test(lower)) {
      return `I can help with:\n\n🏠 **Find properties** — Search and compare listings\n💰 **Price predictions** — AI-powered market analysis\n📖 **Explain features** — Escrow, bookings, wallet, etc.\n🔗 **Wallet help** — MetaMask setup and connection\n❓ **Answer questions** — Everything about the platform\n\nWhat would you like to explore?`;
    }

    // Thesis / research questions
    if (/\b(thesis|capstone|research|dissertation|ukundayezu|hermogene|bachelor|25rp18177)\b/i.test(lower)) {
      return `I have been trained on the thesis **"Real Estate Booking System Using Smart Contract: A Case Study of Kigali"** by **UKUNDAYEZU Hermogene** (Reg. 25RP18177), supervised by UWIZEYE Samuel and co-supervised by MBABAZI Mary (May 2026).

This research addresses **deposit fraud** and **information asymmetry** in Kigali's informal rental market, proposing a decentralized booking system using **Solidity smart contract escrow** on Ethereum. The system was validated via Hardhat testing against 7 vulnerability points.

I can answer detailed questions about:
• **Deposit fraud & ghost listings** — The Abakomisiyoneri problem
• **Smart contract escrow** — 6-state, multi-signature handover mechanism
• **Booking lifecycle** — End-to-end tenant journey
• **System architecture** — Three-tier Web3 (Next.js + Express + Solidity)
• **Security** — JWT, RBAC, 2FA, ReentrancyGuard, fraud detection
• **Recommendations** — MoMo bridge, Layer-2, IoT oracles

What aspect would you like to learn more about?`;
    }

    if (/\b(limitations?|weaknesses?|drawbacks?|cons|downsides?|challenges?|what (is|are) (the )?(limitations?|weaknesses?))\b/.test(lower)) {
      return `**System Limitations (from the thesis, Chapter 6):**

1. **Local Hardhat only** — Not deployed to a public testnet like Sepolia. Real-world validation still needed.
2. **Manual UI confirmation risk** — Users must verify on-chain transactions themselves. Could be confusing for non-technical users.
3. **Crypto adoption barrier** — Requires MetaMask browser extension and ETH tokens. Steep learning curve.
4. **Internet dependency** — No offline mode for blockchain transactions.
5. **Centralized dispute resolution** — Single admin resolves disputes. Not fully decentralized.
6. **No formal TAM study** — Technology Acceptance Model validation hasn't been conducted.
7. **Small sample size** — Only 15 purposive participants in the study.

These are acknowledged in the thesis and suggested as areas for future improvement.`;
    }

    if (/sorry|mistake|wrong|error|bug|not working/.test(lower)) {
      return `No worries! I'm here to help. Could you tell me more about the issue you're experiencing? Common problems include:\n\n• MetaMask connection issues\n• Transaction errors\n• Page loading problems\n• Booking or payment issues\n\nDescribe what happened and I'll do my best to help resolve it!`;
    }

    // Generic fallback
    return `I want to help with "${query}"! Here are topics I know about:\n\n🏠 **Properties** — Browse, filter, compare listings\n💰 **Pricing** — Market trends, price predictions, fair range\n📖 **Escrow** — How deposits are protected by smart contracts\n🔗 **Wallet** — MetaMask setup and connection\n📚 **Thesis / Research** — Ask about the capstone project, deposit fraud, escrow mechanism, limitations, recommendations\n🔐 **Security** — JWT, 2FA, fraud detection\n⚖️ **Legal** — Rwanda Electronic Messages Act, compliance\n\nCould you rephrase or pick a topic above? Type **"help"** for full capabilities.`;
  }
}
