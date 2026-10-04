import { Router, Request, Response } from 'express';
import { TrainingService } from '../services/training.service';
import { RAGService } from '../services/rag.service';

const router = Router();

router.post('/train', async (_req: Request, res: Response) => {
  try {
    const model = await TrainingService.train();
    res.json({
      success: true,
      message: 'Model trained successfully',
      model: {
        version: model.version,
        trainedAt: model.trainedAt,
        stats: model.stats,
        regression: {
          rSquared: model.regression.rSquared,
          sampleCount: model.regression.sampleCount,
          featureNames: model.regression.featureNames,
        },
      },
    });
  } catch (error: any) {
    console.error('[Training] Error:', error);
    res.status(500).json({ error: 'Training failed', details: error.message });
  }
});

router.get('/model-info', async (_req: Request, res: Response) => {
  try {
    const info = TrainingService.getModelInfo();
    if (!info) {
      return res.json({ success: true, model: null, message: 'No model trained yet. POST /api/training/train to train.' });
    }
    res.json({ success: true, model: info });
  } catch (error: any) {
    console.error('[Model Info] Error:', error);
    res.status(500).json({ error: 'Failed to get model info', details: error.message });
  }
});

router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { district, bedrooms, bathrooms, area, amenities } = req.body;
    const prediction = TrainingService.predictPrice({
      district,
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      area: parseFloat(area) || 50,
      amenities: amenities || [],
    });
    if (!prediction) {
      return res.json({ success: true, prediction: null, message: 'Model not trained yet or insufficient data. POST /api/training/train first.' });
    }
    res.json({ success: true, prediction });
  } catch (error: any) {
    console.error('[ML Predict] Error:', error);
    res.status(500).json({ error: 'Prediction failed', details: error.message });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, propertyId, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const result = await RAGService.answer(message, { userId, propertyId });
    res.json({ success: true, response: result.response, source: result.source, confidence: result.confidence });
  } catch (error: any) {
    console.error('[RAG Chat] Error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

export default router;
