import express from 'express';
import mongoose from 'mongoose';

// Initialize the app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection string
const dbURI = 'mongodb+srv://swapnilkhare2990:cdY79gYxheAgw7aS@cluster0.ahhasfr.mongodb.net/';

// Connect to MongoDB
mongoose.connect(dbURI)
  .then(() => app.listen(3000, () => console.log('Server is running on port 3000')))
  .catch(err => console.log(err));

// Define a schema and model for a 'Post'
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Define routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// CRUD API routes
// Create a new post
app.post('/posts', async (req, res) => {
  try {
    const post = new Post(req.body);
    const result = await post.save();
    res.send(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.send(posts);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get a post by ID
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post) {
      res.send(post);
    } else {
      res.status(404).send('Post not found');
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

// Update a post by ID
app.put('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (post) {
      res.send(post);
    } else {
      res.status(404).send('Post not found');
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

// Delete a post by ID
app.delete('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (post) {
      res.send(post);
    } else {
      res.status(404).send('Post not found');
    }
  } catch (err) {
    res.status(400).send(err);
  }
});