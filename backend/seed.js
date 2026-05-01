const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./src/models/Question');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coding-game');

const questions = [
  {
    language: 'Web',
    difficulty: 'Easy',
    code: 'console.log(typeof null);',
    options: ['"null"', '"undefined"', '"object"', '"number"'],
    correctAnswer: '"object"',
    explanation: 'In JavaScript, typeof null is "object". This is considered a historical bug in the language.',
  },
  {
    language: 'Java',
    difficulty: 'Easy',
    code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(10 + 20 + "Java");\n    }\n}',
    options: ['30Java', '1020Java', 'Java30', 'Error'],
    correctAnswer: '30Java',
    explanation: 'Java evaluates from left to right. 10 + 20 is 30, then it concatenates with "Java".',
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
    language: 'Web',
    difficulty: 'Medium',
    code: '<div style="display: flex; flex-direction: column;">\n  <div>A</div>\n  <div>B</div>\n</div>',
    options: ['A B', 'A\nB', 'B A', 'None of above'],
    correctAnswer: 'A\nB',
    explanation: 'flex-direction: column stacks elements vertically.',
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
