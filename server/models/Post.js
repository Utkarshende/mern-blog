const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: String,
  authorName: String,
  authorId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of IDs
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);