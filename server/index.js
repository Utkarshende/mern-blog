const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- ROUTES ---

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User Created" });
  } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
      return res.json({ token, username: user.username, userId: user._id });
    }
    res.status(401).json({ message: "Invalid credentials" });
  } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

// Get All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Post
app.post('/api/posts', auth, async (req, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user.id,
      authorName: req.user.username
    });
    const saved = await post.save();
    res.status(201).json(saved);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Post (Edit)
app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author.toString() !== req.user.id) return res.status(403).send("Unauthorized");
    
    const updated = await Post.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true }
    );
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ready at http://localhost:${PORT}`));