const mongoose = require('mongoose');

const questionSchema = mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    type: {
      type: String,
      required: true,
      enum: ['mcq', 'fill_in_the_blank'],
      default: 'mcq'
    },
    code: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: false,
      default: []
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
