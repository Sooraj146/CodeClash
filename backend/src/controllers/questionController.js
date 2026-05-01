const Question = require('../models/Question');

const getQuestions = async (req, res) => {
  try {
    const { language, difficulty, limit = 5 } = req.query;
    
    let query = {};
    if (language && language !== 'Random') query.language = language;
    if (difficulty) query.difficulty = difficulty;
    
    // Get random questions matching criteria
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(limit) } }
    ]);
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { language, difficulty, type, code, options, correctAnswer, explanation } = req.body;
    
    const question = await Question.create({
      language,
      difficulty,
      type: type || 'mcq',
      code,
      options: type === 'fill_in_the_blank' ? [] : options,
      correctAnswer,
      explanation
    });
    
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, difficulty, type, code, options, correctAnswer, explanation } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      id,
      {
        language,
        difficulty,
        type: type || 'mcq',
        code,
        options: type === 'fill_in_the_blank' ? [] : options,
        correctAnswer,
        explanation
      },
      { new: true }
    );
    
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const normalizeCode = (code) => {
  if (!code) return '';
  return code
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const removeDuplicates = async () => {
  try {
    const duplicates = await Question.aggregate([
      {
        $group: {
          _id: {
            language: "$language",
            difficulty: "$difficulty",
            type: "$type",
            code: "$code"
          },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    const idsToRemove = [];
    duplicates.forEach(doc => {
      // Keep the first one, remove the rest
      idsToRemove.push(...doc.ids.slice(1));
    });

    if (idsToRemove.length > 0) {
      await Question.deleteMany({ _id: { $in: idsToRemove } });
    }
    return idsToRemove.length;
  } catch (error) {
    console.error('Error in removeDuplicates:', error);
    return 0;
  }
};

const bulkAddQuestions = async (req, res) => {
  try {
    const questions = req.body.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of questions' });
    }

    // Get all existing questions to check for duplicates using normalized comparison
    // We include language, difficulty, and type for a more precise match
    const allExisting = await Question.find({}, 'code language difficulty type');
    const getQuestionKey = (q) => `${q.language}|${q.difficulty}|${q.type || 'mcq'}|${normalizeCode(q.code)}`;
    const existingKeys = new Set(allExisting.map(getQuestionKey));

    const formattedQuestions = [];
    const skippedCount = { duplicates: 0, internal: 0 };
    const seenInBatch = new Set();

    for (const q of questions) {
      const qType = q.type || 'mcq';
      const normalCode = normalizeCode(q.code);
      const key = `${q.language}|${q.difficulty}|${qType}|${normalCode}`;
      
      // 1. Check if same question exists in the current upload batch
      if (seenInBatch.has(key)) {
        skippedCount.internal++;
        continue;
      }
      
      // 2. Check if same question exists in the database
      if (existingKeys.has(key)) {
        skippedCount.duplicates++;
        continue;
      }

      formattedQuestions.push({
        ...q,
        type: qType,
        options: qType === 'fill_in_the_blank' ? [] : (q.options || [])
      });
      seenInBatch.add(key);
    }

    let insertedCount = 0;
    if (formattedQuestions.length > 0) {
      const inserted = await Question.insertMany(formattedQuestions);
      insertedCount = inserted.length;
    }

    // After upload, run a thorough cleanup to remove any potential duplicates
    // (This handles race conditions or existing duplicates in the DB)
    const deletedCount = await removeDuplicates();
    
    let responseMsg = `Successfully processed questions. Added ${insertedCount} new questions.`;
    if (skippedCount.duplicates > 0 || skippedCount.internal > 0) {
      responseMsg += ` Skipped ${skippedCount.duplicates + skippedCount.internal} duplicates.`;
    }
    if (deletedCount > 0) {
      responseMsg += ` Cleaned up ${deletedCount} duplicates from database.`;
    }

    res.status(201).json({ 
      message: responseMsg, 
      count: insertedCount,
      skipped: skippedCount.duplicates + skippedCount.internal,
      cleaned: deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, getAllQuestions, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions, removeDuplicates };
