/**
 * Pure TypeScript NLP utilities — no external ML libraries.
 * Tokenization, TF-IDF, cosine similarity, stop words, text preprocessing.
 */

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','need','dare','ought',
  'i','you','he','she','it','we','they','me','him','her','us','them','my','your',
  'his','its','our','their','mine','yours','hers','ours','theirs','this','that',
  'these','those','some','any','no','every','each','all','both','few','many',
  'much','more','most','other','another','such','what','which','who','whom',
  'whose','when','where','why','how','not','no','nor','so','very','too','just',
  'about','above','after','again','against','below','between','during','before',
  'behind','below','beneath','beside','besides','between','beyond','up','down',
  'out','off','over','under','again','further','then','once','here','there',
  'when','where','why','please','help','tell','explain','hi','hello','hey',
]);

/** Tokenize text into lowercase word tokens */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/** Compute term frequency for a document */
export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  const len = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / len);
  return tf;
}

/** Compute inverse document frequency */
export function inverseDocumentFrequency(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  const n = documents.length;
  for (const doc of documents) {
    const seen = new Set(doc);
    for (const t of seen) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }
  return idf;
}

/** Compute TF-IDF vector for a document given global IDF */
export function tfidfVectorize(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = termFrequency(tokens);
  const vec = new Map<string, number>();
  for (const [term, tfVal] of tf) {
    vec.set(term, tfVal * (idf.get(term) || 1));
  }
  return vec;
}

/** Convert Map vector to plain number array sorted by a global term list */
export function vectorToArray(vec: Map<string, number>, vocabulary: string[]): number[] {
  return vocabulary.map(term => vec.get(term) || 0);
}

/** Cosine similarity between two numeric vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Jaccard similarity for keyword overlap */
export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Softmax over similarity scores */
export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores, 0);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

/** Normalize a numeric feature to [0,1] */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/** One-hot encode a categorical value */
export function oneHot(categories: string[], value: string): number[] {
  return categories.map(c => (c === value ? 1 : 0));
}

/** Simple synonym expansion for common terms */
const SYNONYMS: Record<string, string[]> = {
  'hi': ['hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
  'bye': ['goodbye', 'see you', 'farewell', 'cya'],
  'deposit': ['escrow', 'payment', 'fund', 'money', 'eth', 'crypto'],
  'booking': ['reservation', 'rent', 'rental', 'lease', 'stay'],
  'property': ['apartment', 'house', 'villa', 'studio', 'home', 'place', 'listing'],
  'wallet': ['metamask', 'connect', 'web3', 'crypto', 'blockchain'],
  'price': ['cost', 'fee', 'rate', 'rent', 'payment', 'how much'],
  'cancel': ['refund', 'undo', 'stop', 'delete'],
  'help': ['guide', 'tutorial', 'how', 'explain', 'what', 'support'],
};

export function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) syns.forEach(s => expanded.add(s));
  }
  return [...expanded];
}
