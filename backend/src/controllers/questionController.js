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

const addQuestion = async (req, res) => {
  try {
    const { language, difficulty, code, options, correctAnswer, explanation } = req.body;
    
    const question = await Question.create({
      language,
      difficulty,
      code,
      options,
      correctAnswer,
      explanation
    });
    
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, addQuestion };
