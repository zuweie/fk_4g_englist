const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 单词表
const vocabularySchema = new Schema({
  user_id: { type: String, required: true },
  tags: { type: [String], default: [] },
  word: { type: String, required: true },
  gap: { type: [Number], default: [] },
  meaning: { type: String, required: true },
  pronunciation: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 练习表
const exerciseSchema = new Schema({
  name: { type: String, required: true },
  user_id: { type: String, required: true },
  words_number: { type: Number, default: 0 },
  words: { type: [String], default: [] },
  award: { type: String, default: '' },
  award_tips: { type: String, default: '' },
  error_words: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 分析表
const analysisSchema = new Schema({
  user_id: { type: String, required: true },
  error_word: { type: String, required: true },
  error_times: { type: Number, default: 0 },
  correct_times: { type: Number, default: 0 },
  error_rate: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = {
  Vocabulary,
  Exercise,
  Analysis
}; 