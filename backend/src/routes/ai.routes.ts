import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth';
import { AIPricePredictionService, AIChatAssistantService, SmartSearchService } from '../services/ai-ml.service';
import { RAGService } from '../services/rag.service';

const router = Router();

/**
 * @route POST /api/ai/predict-price
 * @desc Get AI-powered price prediction for a property
 */
router.post('/predict-price', async (req: Request, res: Response) => {
  try {
    const { district, bedrooms, bathrooms, area, amenities, condition } = req.body;

    if (!district || !bedrooms || !bathrooms || !area) {
      return res.status(400).json({
        error: 'Missing required fields: district, bedrooms, bathrooms, area',
      });
    }

    const prediction = await AIPricePredictionService.predictPrice({
      district,
      bedrooms,
      bathrooms,
      area,
      amenities: amenities || [],
      condition,
    });

    res.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error('[AI Price Prediction] Error:', error);
    res.status(500).json({
      error: 'Failed to generate price prediction',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/ai/market-trends/:district
 * @desc Get AI-analyzed market trends for a district
 */
router.get('/market-trends/:district', async (req: Request, res: Response) => {
  try {
    const { district } = req.params;

    const trends = await AIPricePredictionService.analyzeMarketTrends(district);

    res.json({
      success: true,
      trends,
    });
  } catch (error: any) {
    console.error('[AI Market Trends] Error:', error);
    res.status(500).json({
      error: 'Failed to analyze market trends',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/ai/explain-contract
 * @desc Smart Contract Translator — plain-language escrow explanation
 */
router.post('/explain-contract', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { depositEth, durationDays, ownerName, ownerId, propertyTitle, propertyId, tenantName, language } = req.body;

    if (!depositEth || !durationDays || !ownerName || !ownerId || !propertyTitle || !propertyId) {
      return res.status(400).json({
        error: 'Missing required fields: depositEth, durationDays, ownerName, ownerId, propertyTitle, propertyId',
      });
    }

    const result = await AIChatAssistantService.explainContract({
      depositEth,
      durationDays,
      ownerName,
      ownerId,
      propertyTitle,
      propertyId,
      tenantName: tenantName || (req as any).userId,
      language: language === 'rw' ? 'rw' : 'en',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AI Explain Contract] Error:', error);
    res.status(500).json({
      error: 'Failed to generate contract explanation',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/ai/chat
 * @desc Chat with AI assistant (Kigali RE Copilot)
 */
router.post('/chat', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { message, propertyId, bookingId } = req.body;
    const userId = (req as any).userId;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    // Try trained RAG model first (knowledge base + property data + market data)
    const ragResult = await RAGService.answer(message, { userId, propertyId });
    if (ragResult.confidence >= 0.2) {
      return res.json({
        success: true,
        response: ragResult.response,
        fallback: false,
        source: ragResult.source,
      });
    }

    // Fallback: existing AI chat (OpenAI → Gemini → Ollama → local)
    const result = await AIChatAssistantService.chat(message, {
      userId,
      propertyId,
      bookingId,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/ai/generate-description
 * @desc Generate property description using AI
 */
router.post('/generate-description', async (req: Request, res: Response) => {
  try {
    const { title, district, bedrooms, bathrooms, amenities, nearbyLandmarks } = req.body;

    if (!title || !district || !bedrooms || !bathrooms) {
      return res.status(400).json({
        error: 'Missing required fields: title, district, bedrooms, bathrooms',
      });
    }

    const description = await AIChatAssistantService.generatePropertyDescription({
      title,
      district,
      bedrooms,
      bathrooms,
      amenities: amenities || [],
      nearbyLandmarks,
    });

    res.json({
      success: true,
      description,
    });
  } catch (error: any) {
    console.error('[AI Description] Error:', error);
    res.status(500).json({
      error: 'Failed to generate description',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/ai/translate
 * @desc Translate property content using AI
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { content, targetLanguage } = req.body;

    if (!content || !targetLanguage) {
      return res.status(400).json({
        error: 'Content and targetLanguage are required',
      });
    }

    const translation = await AIChatAssistantService.translatePropertyContent(
      content,
      targetLanguage
    );

    res.json({
      success: true,
      translation,
    });
  } catch (error: any) {
    console.error('[AI Translation] Error:', error);
    res.status(500).json({
      error: 'Failed to translate content',
      details: error.message,
    });
  }
});

/**
 * @route POST /api/ai/smart-search
 * @desc AI-powered natural language property search
 */
router.post('/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const userId = (req as any).userId;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
      });
    }

    const result = await SmartSearchService.naturalLanguageSearch(query, userId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AI Smart Search] Error:', error);
    res.status(500).json({
      error: 'Failed to perform smart search',
      details: error.message,
    });
  }
});

export default router;
