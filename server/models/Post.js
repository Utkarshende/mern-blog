const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published' }, // New field
  createdAt: { type: Date, default: Date.now }
});