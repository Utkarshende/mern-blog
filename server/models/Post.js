const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: String,
  content: String
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);