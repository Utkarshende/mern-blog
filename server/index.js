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

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Synced"));

app.post('/api/signup', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({ username: req.body.username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "User Registered" });
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    return res.json({ token, username: user.username, userId: user._id });
  }
  res.status(401).json({ message: "Access Denied" });
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/api/posts', auth, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.id, authorName: req.user.username });
  await post.save();
  res.json(post);
});

app.post('/api/posts/:id/view', async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.sendStatus(200);
});

app.listen(5000, () => console.log("🚀 Server running"));