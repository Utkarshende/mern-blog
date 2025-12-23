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

// --- CORRECTED CORS CONFIGURATION ---
app.use(cors({
  origin: "https://mern-chat-api-azure.vercel.app", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// Health Check for Render
app.get("/", (req, res) => res.send("Blog API is running..."));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- ROUTES ---

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User Created" });
  } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

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

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author.toString() !== req.user.id) return res.status(403).send("Unauthorized");
    const updated = await Post.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ready at Port:${PORT}`));