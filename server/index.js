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

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

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
  res.status(401).json({ message: "Invalid" });
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// PUBLIC AUTHOR PROFILE ROUTE
app.get('/api/posts/author/:id', async (req, res) => {
  const posts = await Post.find({ author: req.params.id }).sort({ createdAt: -1 });
  const user = await User.findById(req.params.id).select('username');
  res.json({ posts, username: user.username });
});

app.post('/api/posts/:id/view', async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
  res.sendStatus(200);
});

app.post('/api/upload', auth, upload.single('image'), (req, res) => res.json({ url: req.file.path }));

app.post('/api/posts', auth, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.id, authorName: req.user.username });
  await post.save();
  res.json(post);
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const index = post.likes.indexOf(req.user.id);
  index === -1 ? post.likes.push(req.user.id) : post.likes.splice(index, 1);
  await post.save();
  res.json(post);
});

app.post('/api/posts/:id/comments', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.comments.push({ text: req.body.text, authorName: req.user.username, authorId: req.user.id });
  await post.save();
  res.json(post);
});

app.listen(5000, () => console.log("🚀 Server running"));