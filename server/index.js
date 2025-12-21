const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post');
const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Local React (Vite)
  'http://localhost:3000', // Traditional React
  'https://mern-blog-client-seven.vercel.app' // Your actual Vercel URL (Update this!)
];


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));