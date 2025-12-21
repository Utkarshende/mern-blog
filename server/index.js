const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const Post = require('./models/Post');
const User = require('./models/User'); 
const auth = require('./middleware/auth');

const app = express();

// 1. CORS Configuration (Fixed for your Vercel URL)
const allowedOrigins = [
  'http://localhost:5173', 
  'https://mern-blog-client-ten-vert.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Error'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 2. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- AUTHENTICATION ROUTES ---

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BLOG POST ROUTES ---

// GET all posts (Public)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY ROUTE: Delete after use!
// DELETE THIS AFTER IT WORKS!
app.get('/api/create-admin-force', async (req, res) => {
  try {
    // 1. Clear any old, broken admin users
    await User.deleteMany({ username: 'admin' });

    // 2. Hash the password "password123"
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 3. Create the clean user
    const newUser = new User({
      username: "admin",
      password: hashedPassword
    });

    await newUser.save();
    res.send("✅ Admin 'admin' with password 'password123' created successfully!");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// CREATE post (Protected)
app.post('/api/posts', auth, async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE post (Protected)
app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE post (Protected)
app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Port Configuration for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});