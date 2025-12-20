const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post');
const app = express();

app.use(cors());
app.use(express.json()); // Allows the server to read JSON

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch(err => console.error(err));

// API: Get all blog posts
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find();
  res.json(posts);
});

// API: Create a new blog post
app.post('/api/posts', async (req, res) => {
  const newPost = new Post(req.body);
  const savedPost = await newPost.save();
  res.json(savedPost);
});
// DELETE a post
app.delete('/api/posts/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

// UPDATE a post (Edit or Change Status)
app.put('/api/posts/:id', async (req, res) => {
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    { new: true } // This returns the modified document rather than the original
  );
  res.json(updatedPost);
});

app.listen(5000, () => console.log("Server running on port 5000"));