import React, { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import CommentSection from './CommentSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import DOMPurify from 'dompurify';

const FullPostView = ({ post = {}, onClose, onDelete, onEdit, isAuthor }) => {
  const [likes, setLikes] = useState(post.likes || []);
  const [favorites, setFavorites] = useState(post.favorites || []);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [views, setViews] = useState(post.views || 0);

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
          setViews(postData.views || 0);
        }
      }
    };
    fetchPostData();
  }, [post.id]);

  useEffect(() => {
    const incrementViews = async () => {
      if (post.id) {
        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
          views: increment(1)
        });
        setViews(prevViews => prevViews + 1);
      }
    };
    incrementViews();
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

    const addPageButton = (index) => {
      pageButtons.push(
        <button
          key={index}
          onClick={() => setCurrentPage(index)}
          className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {index + 1}
        </button>
      );
    };

    // Always show first page
    addPageButton(0);

    if (totalPages > 5) {
      if (currentPage > 2) pageButtons.push(<span key="ellipsis1">...</span>);

      // Show current page and one page before and after
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 2); i++) {
        addPageButton(i);
      }

      if (currentPage < totalPages - 3) pageButtons.push(<span key="ellipsis2">...</span>);
    } else {
      // If 5 or fewer pages, show all pages
      for (let i = 1; i < totalPages - 1; i++) {
        addPageButton(i);
      }
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      addPageButton(totalPages - 1);
    }

    return (
      <div className="flex justify-center items-center space-x-2 my-4">
        {pageButtons}
      </div>
    );
  };

  if (!post || Object.keys(post).length === 0) {
    return <div>No post data available.</div>;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-3xl font-serif font-bold text-primary mb-4">{post.title}</h3>
          {post.coverImageURL && (
            <img src={post.coverImageURL} alt={post.title} className="w-full h-48 object-cover mb-4 rounded" />
          )}
          
          {post.synopsis && (
            <div className="mb-4">
              <h4 className="text-lg font-semibold">Synopsis</h4>
              <p className="text-gray-700">{post.synopsis}</p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-lg font-semibold">ページ一覧</h4>
            <ul className="list-disc list-inside">
              {post.pages.map((page, index) => (
                <li key={index}>
                  <button
                    onClick={() => setCurrentPage(index)}
                    className="text-blue-500 hover:underline"
                  >
                    {`${index + 1}. ${page.title || `Page ${index + 1}`}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2 px-7 py-3">
            {renderPageButtons()}
            <h4 className="text-xl font-serif font-bold text-gray-800 mb-2">
              {post.pages[currentPage].title || `Page ${currentPage + 1}`}
            </h4>
            <div 
              className="text-gray-700 text-lg mb-4 text-left whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.pages[currentPage].content) }}
            />
            {renderPageButtons()}
            <p className="text-sm text-gray-500 mb-2 text-left">By: {post.author.name}</p>
            <p className="text-xs text-gray-400 mb-2 text-left">Created: {new Date(post.createdAt).toLocaleString()}</p>
            {post.updatedAt && (
              <p className="text-xs text-gray-400 mb-2 text-left">Updated: {new Date(post.updatedAt).toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-400 mb-2 text-left">Views: {views}</p>
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
            {post.tags && post.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Tags:</p>
                <div className="flex flex-wrap">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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