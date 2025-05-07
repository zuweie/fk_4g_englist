const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 单词表
const vocabularySchema = new Schema({
  user_id: {
    // type: mongoose.Schema.Types.ObjectId,
    type: String,
    // ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true
  },
  meaning: {
    type: String,
    required: true
  },
  pronunciation: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  gap: {
    type: [Number],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 练习表
const exerciseSchema = new Schema({
  name: { type: String, required: true },
  created_by: { type: String, required: true },
  user_id: { type: String, required: true },
  words: { type: [String], default: [] },
  award: { type: String, default: '' },
  award_tips: { type: String, default: '' },
  error_words: { type: [String], default: [] },
  status: { type: String, default: 'unstart' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 分析表
const analysisSchema = new Schema({
  user_id: { type: String, required: true },
  error_word: { type: String, required: true },
  hit_times: { type: Number, default: 0 },
  error_times: { type: Number, default: 0 },
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