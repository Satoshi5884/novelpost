import React, { useEffect, useState } from 'react';
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import FullPostView from './FullPostView';
import { Link } from 'react-router-dom';

const Home = ({ isAuth }) => {
  const [postList, setPostList] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [displayMode, setDisplayMode] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const postsCollectionRef = collection(db, "posts");
        let q = query(postsCollectionRef, where("published", "==", true));
        
        if (selectedTag) {
          q = query(q, where("tags", "array-contains", selectedTag));
        }

        if (displayMode === 'newest') {
          q = query(q, orderBy("createdAt", "desc"));
        } else if (displayMode === 'popular') {
          q = query(q, orderBy("views", "desc"));
        }

        q = query(q, limit(20));

        const data = await getDocs(q);
        let posts = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        if (displayMode === 'favorites' && auth.currentUser) {
          posts = posts.filter(post => 
            post.favorites && post.favorites.includes(auth.currentUser.uid)
          );
        }

        setPostList(posts);

        const tags = [...new Set(posts.flatMap(post => post.tags || []))];
        setAllTags(tags);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    getPosts();
  }, [selectedTag, displayMode]);

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
        <h2 className="text-xl font-semibold mb-2">Display Mode:</h2>
        <div className="flex flex-wrap mb-4">
          {['newest', 'popular', 'favorites'].map((mode) => (
            <button
              key={mode}
              onClick={() => { setDisplayMode(mode); setSelectedTag(null); }}
              className={`mr-2 mb-2 px-3 py-1 rounded-full ${
                displayMode === mode ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-2">Tags:</h2>
        <div className="flex flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={`mr-2 mb-2 px-3 py-1 rounded-full ${
              !selectedTag ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
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

      {loading ? (
        <p className="text-center text-gray-600">Loading posts...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : postList.length === 0 ? (
        <p className="text-center text-gray-600">No published novels available at the moment. Check back later!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postList.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {post.coverImageURL && (
                  <img src={post.coverImageURL} alt={post.title} className="w-full h-48 object-cover mb-4 rounded" />
                )}
                <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">{post.title || "Untitled"}</h2>
                <p className="text-gray-600 mb-2">
                  {post.synopsis || "No synopsis available"}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500">By: {post.author?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-500">Views: {post.views || 0}</p>
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
