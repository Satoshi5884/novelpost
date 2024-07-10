import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

const Home = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);

  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(collection(db, "posts"));
      setPostList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    getPosts();
  }, []);

  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Welcome to NovelPost</h2>
            <p className="mt-2 text-center text-sm text-gray-600">Share your literary creations with the world</p>
          </div>
          <div>
            <a
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sign in to start your journey
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-serif font-bold text-primary mb-8">Novel Excerpts</h1>
      {postList.length === 0 ? (
        <p className="text-center text-gray-600">No novels have been posted yet. Be the first to share your story!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postList.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4">
                  {expandedPostId === post.id ? post.postText : `${post.postText.substring(0, 150)}...`}
                </p>
                <p className="text-sm text-gray-500 mb-2">By: {post.author.name}</p>
                <p className="text-xs text-gray-400 mb-2">Created: {new Date(post.createdAt).toLocaleString()}</p>
                {post.updatedAt && (
                  <p className="text-xs text-gray-400 mb-2">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
                )}
                <button 
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-primary"
                >
                  {expandedPostId === post.id ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;