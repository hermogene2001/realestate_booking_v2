import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { tokenize, tfidfVectorize, inverseDocumentFrequency, vectorToArray, cosineSimilarity, expandTokens } from './nlp.service';
import KNOWLEDGE_BASE, { KnowledgeEntry } from '../data/knowledge-base';

const prisma = new PrismaClient();
const MODEL_PATH = path.resolve(__dirname, '../../data/model.json');

export interface TrainedModel {
  version: number;
  trainedAt: string;
  vocabulary: string[];
  knowledgeBaseVectors: number[][];
  knowledgeBaseEntries: KnowledgeEntry[];
  regression: {
    weights: number[];
    bias: number;
    featureNames: string[];
    featureMeans: number[];
    featureStd: number[];
    districts: string[];
    rSquared: number;
    sampleCount: number;
  };
  stats: {
    totalProperties: number;
    totalBookings: number;
    totalUsers: number;
    knowledgeBaseSize: number;
    trainingLoss: number;
  };
}

let cachedModel: TrainedModel | null = null;

/**
 * AI Training Service — builds and manages the local AI model
 */
export class TrainingService {
  /**
   * Train the full AI model from scratch using database data
   */
  static async train(): Promise<TrainedModel> {
    console.log('[Training] Starting full AI model training...');

    // 1. Build knowledge base vectors (TF-IDF)
    console.log('[Training] Building knowledge base vectors...');
    const kbDocuments = KNOWLEDGE_BASE.map(e =>
      tokenize([...e.keywords, ...e.questions.join(' ')].join(' '))
    );
    const allKbTokens = kbDocuments.flat();
    const kbIdf = inverseDocumentFrequency(kbDocuments);
    const kbVocab = [...new Set(allKbTokens)].sort();
    const kbVectors = kbDocuments.map(doc =>
      vectorToArray(tfidfVectorize(doc, kbIdf), kbVocab)
    );

    // 2. Train price regression model
    console.log('[Training] Training price prediction regression model...');
    const allProperties = await prisma.property.findMany({
      where: { status: 'AVAILABLE', isApproved: true },
      select: {
        priceEth: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        district: true,
        amenities: true,
        createdAt: true,
      },
    });

    const districts = ['Gasabo', 'Kicukiro', 'Nyarugenge'];
    const X: number[][] = [];
    const y: number[] = [];

    for (const p of allProperties) {
      const price = parseFloat(p.priceEth);
      if (isNaN(price) || price <= 0) continue;
      const amenities: string[] = typeof p.amenities === 'string'
        ? (() => { try { return JSON.parse(p.amenities as string); } catch { return []; } })()
        : Array.isArray(p.amenities) ? p.amenities : [];
      const premiumAmenities = ['pool', 'gym', 'security', 'generator', 'cctv', 'air_conditioning'];
      const premiumCount = amenities.filter(a => premiumAmenities.includes(a)).length;

      const features = [
        p.bedrooms,
        p.bathrooms,
        p.area,
        amenities.length,
        premiumCount,
        p.district === 'Gasabo' ? 1 : 0,
        p.district === 'Kicukiro' ? 1 : 0,
        p.district === 'Nyarugenge' ? 1 : 0,
      ];
      X.push(features);
      y.push(price);
    }

    const featureNames = ['bedrooms', 'bathrooms', 'area', 'amenities', 'premium_amenities', 'district_gasabo', 'district_kicukiro', 'district_nyarugenge'];
    const sampleCount = y.length;

    // Normalize features
    const featureMeans = featureNames.map((_, i) => X.reduce((s, r) => s + r[i], 0) / sampleCount);
    const featureStd = featureNames.map((_, i) => {
      const mean = featureMeans[i];
      return Math.sqrt(X.reduce((s, r) => s + (r[i] - mean) ** 2, 0) / sampleCount) || 1;
    });
    const XNorm = X.map(row => row.map((v, i) => (v - featureMeans[i]) / featureStd[i]));

    // Train using gradient descent
    const learningRate = 0.01;
    const epochs = 1000;
    let weights = new Array(featureNames.length).fill(0);
    let bias = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const gradW = new Array(featureNames.length).fill(0);
      let gradB = 0;

      for (let i = 0; i < XNorm.length; i++) {
        const prediction = XNorm[i].reduce((sum, x, j) => sum + x * weights[j], 0) + bias;
        const error = prediction - y[i];
        totalLoss += error * error;
        for (let j = 0; j < featureNames.length; j++) {
          gradW[j] += error * XNorm[i][j];
        }
        gradB += error;
      }

      totalLoss /= (2 * XNorm.length);
      for (let j = 0; j < featureNames.length; j++) {
        weights[j] -= (learningRate * gradW[j]) / XNorm.length;
      }
      bias -= (learningRate * gradB) / XNorm.length;

      if (epoch % 200 === 0) {
        console.log(`[Training] Epoch ${epoch}, Loss: ${totalLoss.toFixed(6)}`);
      }
    }

    const trainingLoss = XNorm.reduce((sum, row, i) => {
      const pred = row.reduce((s, x, j) => s + x * weights[j], 0) + bias;
      return sum + (pred - y[i]) ** 2;
    }, 0) / (2 * XNorm.length);

    // Calculate R²
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssRes = y.reduce((sum, yi, i) => {
      const pred = XNorm[i].reduce((s, x, j) => s + x * weights[j], 0) + bias;
      return sum + (yi - pred) ** 2;
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    // Fetch stats
    const totalProperties = await prisma.property.count();
    const totalBookings = await prisma.booking.count();
    const totalUsers = await prisma.user.count();

    // Build model object
    const model: TrainedModel = {
      version: Date.now(),
      trainedAt: new Date().toISOString(),
      vocabulary: kbVocab,
      knowledgeBaseVectors: kbVectors,
      knowledgeBaseEntries: KNOWLEDGE_BASE,
      regression: {
        weights,
        bias,
        featureNames,
        featureMeans,
        featureStd,
        districts,
        rSquared,
        sampleCount,
      },
      stats: {
        totalProperties,
        totalBookings,
        totalUsers,
        knowledgeBaseSize: KNOWLEDGE_BASE.length,
        trainingLoss,
      },
    };

    // Save to disk
    const dir = path.dirname(MODEL_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(MODEL_PATH, JSON.stringify(model, null, 2), 'utf-8');
    cachedModel = model;

    console.log(`[Training] ✅ Model trained successfully!
    - Knowledge base: ${KNOWLEDGE_BASE.length} entries
    - Regression: ${sampleCount} samples, R²=${rSquared.toFixed(4)}, Loss=${trainingLoss.toFixed(6)}
    - Platform: ${totalProperties} properties, ${totalBookings} bookings, ${totalUsers} users`);

    return model;
  }

  /** Load the trained model from disk or cache */
  static loadModel(): TrainedModel | null {
    if (cachedModel) return cachedModel;
    try {
      if (fs.existsSync(MODEL_PATH)) {
        const raw = fs.readFileSync(MODEL_PATH, 'utf-8');
        cachedModel = JSON.parse(raw);
        return cachedModel;
      }
    } catch (e) {
      console.error('[Model] Failed to load model:', e);
    }
    return null;
  }

  /** Get model info (without the full vectors for lightweight response) */
  static getModelInfo(): Partial<TrainedModel> | null {
    const model = this.loadModel();
    if (!model) return null;
    return {
      version: model.version,
      trainedAt: model.trainedAt,
      stats: model.stats,
      regression: {
        ...model.regression,
        weights: [], // exclude weight values for privacy
        bias: 0,
      },
    };
  }

  /** Search knowledge base for the best matching entry */
  static searchKnowledgeBase(query: string, topK: number = 3): Array<{ entry: KnowledgeEntry; score: number }> {
    const model = this.loadModel();
    if (!model) return [];

    const queryTokens = expandTokens(tokenize(query));
    if (queryTokens.length === 0) return [];

    const qIdf = inverseDocumentFrequency([
      queryTokens,
      ...model.knowledgeBaseEntries.map(e => tokenize([...e.keywords, ...e.questions.join(' ')].join(' ')))
    ]);
    const qVec = vectorToArray(tfidfVectorize(queryTokens, qIdf), model.vocabulary);

    const scored = model.knowledgeBaseVectors.map((kbVec, i) => ({
      entry: model.knowledgeBaseEntries[i],
      score: cosineSimilarity(qVec, kbVec),
    }));

    // Also compute keyword overlap for bonus
    const querySet = new Set(queryTokens);
    for (const s of scored) {
      const kwSet = new Set(s.entry.keywords.map(k => k.toLowerCase()));
      const overlap = jaccard(querySet, kwSet);
      s.score = s.score * 0.6 + overlap * 0.4;
    }

    scored.sort((a, b) => b.score - a.score);
    const threshold = 0.15;
    return scored.filter(s => s.score > threshold).slice(0, topK);
  }

  /** Predict price using trained regression model */
  static predictPrice(features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    amenities: string[];
    district: string;
  }): { predictedPriceEth: number; confidence: number } | null {
    const model = this.loadModel();
    if (!model || model.regression.sampleCount < 3) return null;

    const { weights, bias, featureMeans, featureStd, sampleCount } = model.regression;
    const premiumAmenities = ['pool', 'gym', 'security', 'generator', 'cctv', 'air_conditioning'];
    const premiumCount = features.amenities.filter(a => premiumAmenities.includes(a)).length;

    const rawFeatures = [
      features.bedrooms,
      features.bathrooms,
      features.area,
      features.amenities.length,
      premiumCount,
      features.district === 'Gasabo' ? 1 : 0,
      features.district === 'Kicukiro' ? 1 : 0,
      features.district === 'Nyarugenge' ? 1 : 0,
    ];

    const normalized = rawFeatures.map((v, i) => (v - featureMeans[i]) / featureStd[i]);
    const predicted = normalized.reduce((sum, x, i) => sum + x * weights[i], 0) + bias;
    const confidence = Math.min(1, sampleCount / 50); // More samples = higher confidence

    return {
      predictedPriceEth: Math.max(0, predicted),
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
