const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// Auth Routes
app.post('/api/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    // Note: Hash password here if not handled in model pre-save
    await user.save();
    res.status(201).send("OK");
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) { // add password compare logic here
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
      res.json({ token, userId: user._id });
    } else { res.status(401).send("Fail"); }
  } catch (err) { res.status(500).send(err.message); }
});

// Posts Routes
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const post = new Post({ ...req.body, author: req.user.id, authorName: req.user.username });
    await post.save();
    res.status(201).json(post);
  } catch (err) { res.status(500).send(err.message); }
});

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author.toString() !== req.user.id) return res.status(403).send("Forbidden");
    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(5000, () => console.log("🚀 Server Live on 5000"));