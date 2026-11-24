const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const Post = require('../models/postModel');
const User = require('../models/userModel');
const HttpError = require('../models/errorModel');


const createPost = async (req, res, next) => {
  try {
    const { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(new HttpError("Fill in all fields and choose thumbnail.", 422));
    }

    const { thumbnail } = req.files;
    if (thumbnail.size > 2000000) {
      return next(new HttpError("Thumbnail too big. Files should be less than 2mb.", 422));
    }

    const splittedFilename = thumbnail.name.split('.');
    const fileExt = splittedFilename[splittedFilename.length - 1];
    const newFilename = splittedFilename[0] + uuid() + '.' + fileExt;

    thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
      if (err) {
        return next(new HttpError(err));
      }

      const newPost = await Post.create({
        title,
        category,
        description,
        thumbnail: newFilename,
        creator: req.user.id
      });

      if (!newPost) {
        return next(new HttpError("Post couldn't be created.", 422));
      }

      
      const currentUser = await User.findById(req.user.id);
      //update code
      const userPostCount = (currentUser.posts || 0) + 1;
      await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

      res.status(201).json(newPost);
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};


const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};


const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }
    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

const getCatPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const catPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(catPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};


const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userPosts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};


const editPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, category, description } = req.body;

    if (!title || !category || description.length < 12) {
      return next(new HttpError("Fill in all fields.", 422));
    }

    const oldPost = await Post.findById(postId);
    if (!oldPost) {
      return next(new HttpError("Post not found.", 404));
    }

    
    if (req.user.id !== oldPost.creator.toString()) {
      return next(new HttpError("Unauthorized to edit this post.", 403));
    }

    let updatedPost;
    
    if (!req.files) {
      updatedPost = await Post.findByIdAndUpdate(
        postId, 
        { title, category, description }, 
        { new: true }
      );
    } else {
      const oldThumbnailPath = path.join(__dirname, '..', 'uploads', oldPost.thumbnail);
      if (fs.existsSync(oldThumbnailPath)) {
        fs.unlinkSync(oldThumbnailPath);
      }

      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return next(new HttpError("Thumbnail too big. Should be less than 2mb.", 422));
      }

      const splittedFilename = thumbnail.name.split('.');
      const fileExt = splittedFilename[splittedFilename.length - 1];
      const newFilename = splittedFilename[0] + uuid() + '.' + fileExt;

      await thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename));

      updatedPost = await Post.findByIdAndUpdate(
        postId, 
        { title, category, description, thumbnail: newFilename }, 
        { new: true }
      );
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};


const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("Post unavailable.", 400));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

   
    if (req.user.id !== post.creator.toString()) {
      return next(new HttpError("Unauthorized to delete this post.", 403));
    }

    const thumbnailPath = path.join(__dirname, '..', 'uploads', post.thumbnail);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    await Post.findByIdAndDelete(postId);

    // User ၏ post count ကို ၁ လျှော့ချခြင်း
    const currentUser = await User.findById(req.user.id);
    const userPostCount = currentUser.posts - 1;
    await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

    res.status(200).json(`Post ${postId} deleted successfully.`);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  getCatPosts,
  getUserPosts,
  editPost,
  deletePost
};