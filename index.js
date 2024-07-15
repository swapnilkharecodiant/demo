import dotenv from 'dotenv'
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import multerS3 from 'multer-s3-transform';
import AWS from 'aws-sdk';

// Initialize the app
const app = express();

// Initiate env
dotenv.config();

// Middleware to parse JSON
app.use(express.json());

/****************************** Connect to MongoDB **********************************/

// MongoDB connection string
const dbURI = process.env.DATABASE_URL;

mongoose.connect(dbURI)
  .then(() => app.listen(process.env.PORT || 3000, () => console.log('Server is running on port 3000')))
  .catch(err => console.log(err));

// Define a schema and model for a 'Post'
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

/****************** Configure AWS with your access and secret key. *******************/

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // or your access key here
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // or your secret key here
  region: process.env.AWS_REGION, // or your desired region here
});

let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')  // Destination folder for uploaded files
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now().toString()}-${file.originalname}`);
  }
});

// Set storage engine
if(process.env.STORAGE_TYPE === 's3'){
  storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const fileName = `${Date.now().toString()}-${file.originalname}`;
      cb(null, fileName);
    },
    contentType: (req, file, cb) => {
      cb(null, file?.mimetype);
    },
    ACL(req, file, cb) {
      const acl = 'public-read';
      cb(null, acl);
    },
  });
}

// Set up multer S3 storage engine
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // File size limit (optional)
});

/********************************** Define routes *************************************/

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Single file upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    res.send({
      message: 'File uploaded successfully',
      file: req.file,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// CRUD API routes
// Create a new post
app.post('/posts', async (req, res) => {
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
    }
    const post = new Post(data);
    const result = await post.save();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.send(posts);
  } catch (err) {
    res.status(500).send(err);
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
    res.status(500).send(err);
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
    res.status(500).send(err);
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
    res.status(500).send(err);
  }
});