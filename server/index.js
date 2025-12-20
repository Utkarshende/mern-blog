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

app.listen(5000, () => console.log("Server running on port 5000"));