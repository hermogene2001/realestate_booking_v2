import { TrainingService } from '../services/training.service';

async function main() {
  const queries = [
    "thesis deposit fraud Kigali escrow",
    "What is this thesis about?",
    "How does the smart contract escrow work?",
    "limitations of this system",
    "RealEstateEscrow contract",
  ];

  // Force retrain model
  const model = await TrainingService.train();

  console.log(`Knowledge base size: ${model.knowledgeBaseEntries.length}`);
  console.log(`Vocabulary size: ${model.vocabulary.length}\n`);

  for (const q of queries) {
    const results = TrainingService.searchKnowledgeBase(q, 3);
    console.log(`Query: "${q}"`);
    if (results.length === 0) {
      console.log('  No results found');
    } else {
      for (const r of results) {
        console.log(`  Score: ${r.score.toFixed(4)} | ID: ${r.entry.id} | Keywords: ${r.entry.keywords.slice(0, 5).join(', ')}`);
        console.log(`    Q: ${r.entry.questions[0]}`);
        console.log(`    Answer preview: ${r.entry.answer.substring(0, 100)}...`);
      }
    }
    console.log('');
  }
}

main().catch(console.error).finally(() => process.exit(0));
