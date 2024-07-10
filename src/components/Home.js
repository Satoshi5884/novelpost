import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import FullPostView from './FullPostView';
import { Link } from 'react-router-dom';

const Home = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);

  useEffect(() => {
    const getPosts = async () => {
      const postsCollectionRef = collection(db, "posts");
      const publishedPostsQuery = query(postsCollectionRef, where("published", "==", true));
      const data = await getDocs(publishedPostsQuery);
      setPostList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    getPosts();
  }, []);

  if (expandedPost) {
    return (
      <FullPostView 
        post={expandedPost} 
        onClose={() => setExpandedPost(null)}
        isAuthor={false}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-primary">Novel Excerpts</h1>
        {!isAuth && (
          <Link
            to="/login"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition duration-300"
          >
            Sign in to post
          </Link>
        )}
      </div>
      {postList.length === 0 ? (
        <p className="text-center text-gray-600">No published novels available at the moment. Check back later!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postList.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.postText.substring(0, 150)}...</p>
                <p className="text-sm text-gray-500 mb-2">By: {post.author.name}</p>
                <p className="text-xs text-gray-400 mb-2">Created: {new Date(post.createdAt).toLocaleString()}</p>
                {post.updatedAt && (
                  <p className="text-xs text-gray-400 mb-2">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
                )}
                <button 
                  onClick={() => setExpandedPost(post)}
                  className="mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-primary transition duration-300"
                >
                  Read More
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