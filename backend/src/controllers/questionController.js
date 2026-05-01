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

const bulkAddQuestions = async (req, res) => {
  try {
    const questions = req.body.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of questions' });
    }

    const formattedQuestions = questions.map(q => ({
      ...q,
      type: q.type || 'mcq',
      options: q.type === 'fill_in_the_blank' ? [] : (q.options || [])
    }));

    const inserted = await Question.insertMany(formattedQuestions);
    res.status(201).json({ message: `Successfully added ${inserted.length} questions`, count: inserted.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuestions, getAllQuestions, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions };
