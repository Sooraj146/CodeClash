const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./src/models/Question');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coding-game');

const questions = [
  {
    language: 'JavaScript',
    difficulty: 'Easy',
    code: 'console.log(typeof null);',
    options: ['"null"', '"undefined"', '"object"', '"number"'],
    correctAnswer: '"object"',
    explanation: 'In JavaScript, typeof null is "object". This is considered a historical bug in the language.',
  },
  {
    language: 'JavaScript',
    difficulty: 'Medium',
    code: 'let a = {};\nlet b = a;\nconsole.log(a === b);',
    options: ['true', 'false', 'undefined', 'ReferenceError'],
    correctAnswer: 'true',
    explanation: 'Both a and b reference the same object in memory, so they are strictly equal.',
  },
  {
    language: 'Python',
    difficulty: 'Easy',
    code: 'print(type([]))',
    options: ['<class \'list\'>', '<class \'array\'>', '<type \'list\'>', '<type \'array\'>'],
    correctAnswer: '<class \'list\'>',
    explanation: 'In Python 3, the type of a list is <class \'list\'>.',
  },
  {
    language: 'Python',
    difficulty: 'Medium',
    code: 'def foo(a, b=[]):\n    b.append(a)\n    return b\n\nprint(foo(1))\nprint(foo(2))',
    options: ['[1]\n[2]', '[1]\n[1, 2]', '[1]\n[2, 1]', 'Error'],
    correctAnswer: '[1]\n[1, 2]',
    explanation: 'Default mutable arguments like lists are evaluated only once when the function is defined. Thus, the same list is modified across multiple calls.',
  }
];

const seedDB = async () => {
  try {
    await Question.deleteMany();
    await Question.insertMany(questions);
    console.log('Database Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
