const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');
const dotenv = require('dotenv');

dotenv.config();

// Require Question model
const Question = require('./src/models/Question');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coding-game';

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB.');

  // Wipe existing questions
  const deleted = await Question.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing questions.`);

  // Parse the CSV
  const csvPath = path.join(__dirname, 'sample_questions.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim()
  });

  if (errors.length > 0) {
    console.error('CSV parse errors:', errors);
  }

  const questions = data.map(row => ({
    language: (row.language || 'Python').trim(),
    difficulty: (row.difficulty || 'Medium').trim(),
    type: (row.type || 'mcq').trim(),
    code: (row.code || '').trim(),
    options: (row.type || '').trim() === 'fill_in_the_blank'
      ? []
      : (row.options ? row.options.split('|').map(s => s.trim()).filter(Boolean) : []),
    correctAnswer: (row.correctAnswer || '').trim(),
    explanation: (row.explanation || '').trim()
  }));

  const inserted = await Question.insertMany(questions);
  console.log(`✅ Successfully seeded ${inserted.length} questions from sample_questions.csv!`);
  process.exit(0);
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
