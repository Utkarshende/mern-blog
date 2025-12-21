const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Models
const Post = require('./models/Post');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'modern_blog', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
});
const upload = multer({ storage });

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- ROUTES ---

// 1. Authentication
app.post('/api/signup', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign(
        { id: user._id, username: user.username }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({ token, username: user.username, userId: user._id });
    }
    res.status(401).json({ message: "Invalid credentials" });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 2. Image Upload
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: req.file.path });
});

// 3. Profiles
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const posts = await Post.find({ author: req.params.id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) {
    res.status(404).json({ message: "User not found" });
  }
});

// 4. Post Management (CRUD)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch posts" });
  }
});

// CREATE POST (Supports Draft/Published status)
app.post('/api/posts', auth, async (req, res) => {
  try {
    const { title, content, imageUrl, status } = req.body;
    const post = new Post({
      title,
      content,
      imageUrl: imageUrl || "",
      status: status || "published", // Default to published if not specified
      author: req.user.id,
      authorName: req.user.username
    });
    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error("Save Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE POST (Edit existing posts)
app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    // Check if user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to edit this post" });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE POST
app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server Live on Port ${PORT}`));