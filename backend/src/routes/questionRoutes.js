const express = require('express');
const { getQuestions, addQuestion } = require('../controllers/questionController');

const router = express.Router();

router.route('/').get(getQuestions).post(addQuestion);

module.exports = router;
