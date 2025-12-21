const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const Post = require('./models/Post');
const User = require('./models/User');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary Configuration
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

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// Image Upload Endpoint
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.json({ url: req.file.path });
});

// Auth Endpoints
app.post('/api/signup', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({ username: req.body.username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "Success" });
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    return res.json({ token, username: user.username, userId: user._id });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

// Post Endpoints
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/api/posts', auth, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.id, authorName: req.user.username });
  await post.save();
  res.json(post);
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));