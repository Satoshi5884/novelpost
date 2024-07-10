import React, { useState, useEffect } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth, getUserAuthorName } from '../firebase';
import { useNavigate } from 'react-router-dom';

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  const createPost = async (isPublished) => {
    try {
      const authorName = await getUserAuthorName(auth.currentUser.uid) || auth.currentUser.displayName;
      await addDoc(collection(db, "posts"), {
        title,
        postText,
        author: {
          name: authorName,
          id: auth.currentUser.uid
        },
        published: isPublished,
        likes: [],
        createdAt: new Date().toISOString(),
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Create a New Post</h1>
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            placeholder="Title..."
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="postText" className="block text-sm font-medium text-gray-700">Post</label>
          <textarea
            id="postText"
            placeholder="Post..."
            onChange={(e) => setPostText(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="6"
          />
        </div>
        <div className="flex justify-between">
          <button onClick={() => createPost(false)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-primary bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Save as Draft
          </button>
          <button onClick={() => createPost(true)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;