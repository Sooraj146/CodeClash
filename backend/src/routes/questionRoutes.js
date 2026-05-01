const express = require('express');
const { getQuestions, getAllQuestions, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions } = require('../controllers/questionController');

const router = express.Router();

router.route('/')
  .get(getQuestions)
  .post(addQuestion);

router.route('/all')
  .get(getAllQuestions);

router.route('/bulk')
  .post(bulkAddQuestions);

router.route('/:id')
  .put(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;
