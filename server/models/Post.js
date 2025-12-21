const mongoose = require('mongoose'); 

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  }
}, { timestamps: true });

// THIS IS THE MISSING PIECE:
module.exports = mongoose.model('Post', postSchema);