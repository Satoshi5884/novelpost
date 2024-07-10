import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EditPost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [published, setPublished] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }
    
    const getPostDetails = async () => {
      try {
        const postDoc = doc(db, "posts", id);
        const postData = await getDoc(postDoc);
        if (postData.exists()) {
          setTitle(postData.data().title);
          setPostText(postData.data().postText);
          setPublished(postData.data().published);
        } else {
          console.error("Post not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        navigate("/");
      }
    };
    getPostDetails();
  }, [id, isAuth, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || !postText) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const postDoc = doc(db, "posts", id);
      await updateDoc(postDoc, {
        title: title,
        postText: postText,
        published: published,
        updatedAt: new Date().toISOString(),
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Edit Post</h1>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="postText" className="block text-sm font-medium text-gray-700">Post</label>
          <textarea
            id="postText"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="6"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700">Publish this post</label>
        </div>
        <button 
          type="submit" 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Update Post
        </button>
      </form>
    </div>
  );
};

export default EditPost;