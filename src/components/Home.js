import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import FullPostView from './FullPostView';
import { Link } from 'react-router-dom';

const Home = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const postsCollectionRef = collection(db, "posts");
        let q = query(postsCollectionRef, where("published", "==", true));
        
        if (selectedTag) {
          q = query(q, where("tags", "array-contains", selectedTag));
        }

        const data = await getDocs(q);
        const posts = data.docs.map((doc) => {
          const postData = doc.data();
          return {
            ...postData,
            id: doc.id,
            pages: Array.isArray(postData.pages) ? postData.pages : [],
          };
        });
        setPostList(posts);

        // Extract all unique tags
        const tags = [...new Set(posts.flatMap(post => post.tags || []))];
        setAllTags(tags);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPostList([]);
      }
    };
    getPosts();
  }, [selectedTag]);

  const getPostContent = (post) => {
    if (post.pages && post.pages.length > 0 && typeof post.pages[0].content === 'string') {
      return post.pages[0].content.substring(0, 150);
    }
    return "No content available";
  };

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

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Tags:</h2>
        <div className="flex flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={`mr-2 mb-2 px-3 py-1 rounded-full ${
              selectedTag === null ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                selectedTag === tag ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {postList.length === 0 ? (
        <p className="text-center text-gray-600">No published novels available at the moment. Check back later!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postList.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title || "Untitled"}</h2>
                <p className="text-gray-600 mb-4">
                  {getPostContent(post)}...
                </p>
                <p className="text-sm text-gray-500 mb-2">By: {post.author?.name || "Unknown Author"}</p>
                <p className="text-xs text-gray-400 mb-2">Pages: {post.pages?.length || 0}</p>
                <p className="text-xs text-gray-400 mb-2">Created: {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Unknown"}</p>
                {post.updatedAt && (
                  <p className="text-xs text-gray-400 mb-2">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
                )}
                <div className="mb-4">
                  {post.tags && post.tags.map((tag, index) => (
                    <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                      {tag}
                    </span>
                  ))}
                </div>
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