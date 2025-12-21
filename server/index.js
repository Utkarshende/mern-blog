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

// Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'blog_mern', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'] },
});
const upload = multer({ storage });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.error(err));

// --- AUTH ---
app.post('/api/signup', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({ username: req.body.username, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "Created" });
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    return res.json({ token, username: user.username });
  }
  res.status(401).json({ message: "Invalid" });
});

// --- UPLOAD ---
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  res.json({ url: req.file.path });
});

// --- POSTS & COMMENTS ---
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.get('/api/posts/me', auth, async (req, res) => {
  const posts = await Post.find({ author: req.user.id }).sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/api/posts', auth, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.id, authorName: req.user.username });
  await post.save();
  res.json(post);
});

app.post('/api/posts/:id/comments', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ text: req.body.text, authorName: req.user.username, authorId: req.user.id });
  await post.save();
  res.json(post);
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author.toString() !== req.user.id) return res.status(403).send();
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));