import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CommentSection from './CommentSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

const FullPostView = ({ post = {}, onClose, onDelete, onEdit, isAuthor }) => {
  const [likes, setLikes] = useState(post.likes || []);
  const [favorites, setFavorites] = useState(post.favorites || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      setIsLiked(likes.includes(auth.currentUser.uid));
      setIsFavorite(favorites.includes(auth.currentUser.uid));
    }
  }, [likes, favorites]);

  useEffect(() => {
    const fetchPostData = async () => {
      if (post.id) {
        const postDoc = await getDoc(doc(db, 'posts', post.id));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setLikes(postData.likes || []);
          setFavorites(postData.favorites || []);
          setIsLiked(postData.likes?.includes(auth.currentUser?.uid) || false);
          setIsFavorite(postData.favorites?.includes(auth.currentUser?.uid) || false);
        }
      }
    };
    fetchPostData();
  }, [post.id]);

  const handleLike = async () => {
    if (!auth.currentUser) {
      alert("Please log in to like posts.");
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    if (isLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(auth.currentUser.uid)
      });
      setLikes(likes.filter(id => id !== auth.currentUser.uid));
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(auth.currentUser.uid)
      });
      setLikes([...likes, auth.currentUser.uid]);
    }
    setIsLiked(!isLiked);
  };

  const handleFavorite = async () => {
    if (!auth.currentUser) {
      alert("Please log in to favorite posts.");
      return;
    }

    const postRef = doc(db, 'posts', post.id);
    if (isFavorite) {
      await updateDoc(postRef, {
        favorites: arrayRemove(auth.currentUser.uid)
      });
      setFavorites(favorites.filter(id => id !== auth.currentUser.uid));
    } else {
      await updateDoc(postRef, {
        favorites: arrayUnion(auth.currentUser.uid)
      });
      setFavorites([...favorites, auth.currentUser.uid]);
    }
    setIsFavorite(!isFavorite);
  };

  const renderPageButtons = () => {
    const totalPages = post.pages.length;
    const pageButtons = [];

    if (totalPages <= 5) {
      for (let i = 0; i < totalPages; i++) {
        pageButtons.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`mr-2 mb-2 px-3 py-1 rounded ${currentPage === i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {i + 1}
          </button>
        );
      }
    } else {
      // Always show first and last page
      pageButtons.push(
        <button
          key={0}
          onClick={() => setCurrentPage(0)}
          className={`mr-2 mb-2 px-3 py-1 rounded ${currentPage === 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          1
        </button>
      );

      if (currentPage > 2) {
        pageButtons.push(<span key="ellipsis1">...</span>);
      }

      // Show current page and one before and after
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        pageButtons.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`mr-2 mb-2 px-3 py-1 rounded ${currentPage === i ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {i + 1}
          </button>
        );
      }

      if (currentPage < totalPages - 3) {
        pageButtons.push(<span key="ellipsis2">...</span>);
      }

      pageButtons.push(
        <button
          key={totalPages - 1}
          onClick={() => setCurrentPage(totalPages - 1)}
          className={`mr-2 mb-2 px-3 py-1 rounded ${currentPage === totalPages - 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          {totalPages}
        </button>
      );
    }

    return <div className="flex flex-wrap justify-center mb-4">{pageButtons}</div>;
  };

  if (!post || Object.keys(post).length === 0) {
    return <div>No post data available.</div>;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-3xl font-serif font-bold text-primary mb-4">{post.title}</h3>
          <div className="mt-2 px-7 py-3">
            {currentPage === null ? (
              <div>
                {post.coverImageURL && (
                  <img src={post.coverImageURL} alt={post.title} className="w-full h-48 object-cover mb-4 rounded" />
                )}
                <h4 className="text-xl font-serif font-bold text-gray-800 mb-2"></h4>
                <p className="text-gray-700 text-lg mb-4 text-left whitespace-pre-wrap">{post.synopsis}</p>
                <h4 className="text-xl font-serif font-bold text-gray-800 mb-2">Pages</h4>
                {post.pages.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    {index + 1}. {page.title || `Page ${index + 1}`}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {renderPageButtons()}
                <h4 className="text-xl font-serif font-bold text-gray-800 mb-2">
                  {post.pages[currentPage].title || `Page ${currentPage + 1}`}
                </h4>
                <p className="text-gray-700 text-lg mb-4 text-left whitespace-pre-wrap">{post.pages[currentPage].content}</p>
                {renderPageButtons()}
                <button
                  onClick={() => setCurrentPage(null)}
                  className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-primary transition duration-300"
                >
                  Back to Overview
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-2 text-left">By: {post.author.name}</p>
            <p className="text-xs text-gray-400 mb-2 text-left">Created: {new Date(post.createdAt).toLocaleString()}</p>
            {post.updatedAt && (
              <p className="text-xs text-gray-400 mb-2 text-left">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
            )}
            <div className="flex items-center mb-4 space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{likes.length} {likes.length === 1 ? 'Like' : 'Likes'}</span>
              </button>
              <button
                onClick={handleFavorite}
                className={`flex items-center space-x-1 ${isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}
              >
                <FontAwesomeIcon icon={isFavorite ? faStarSolid : faStarRegular} />
                <span>{favorites.length} {favorites.length === 1 ? 'Favorite' : 'Favorites'}</span>
              </button>
            </div>
          </div>
          <CommentSection postId={post.id} isAuthor={isAuthor} />
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 mb-2"
            >
              Close
            </button>
            {isAuthor && (
              <>
                <button
                  onClick={() => onEdit(post.id)}
                  className="px-4 py-2 bg-secondary text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-blue-300 mb-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPostView;