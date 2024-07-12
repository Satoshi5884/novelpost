import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_CHARS_PER_PAGE = 10000;

const EditPost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([{ content: "", createdAt: "", updatedAt: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          const data = postData.data();
          setTitle(data.title);
          setPages(data.pages && data.pages.length > 0 ? data.pages : [{ content: "", createdAt: "", updatedAt: "" }]);
          setTags(data.tags || []);
          setPublished(data.published);
        } else {
          setError("Post not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setError("Failed to load post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    getPostDetails();
  }, [id, isAuth, navigate]);

  const handlePageChange = (index) => {
    if (pages && index >= 0 && index < pages.length) {
      setCurrentPage(index);
    }
  };

  const addNewPage = () => {
    const newPage = {
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPages(prevPages => [...(prevPages || []), newPage]);
    setCurrentPage(pages ? pages.length : 0);
  };

  const updatePageContent = (content) => {
    if (pages && currentPage >= 0 && currentPage < pages.length) {
      const newPages = [...pages];
      newPages[currentPage] = {
        ...newPages[currentPage],
        content: content,
        updatedAt: new Date().toISOString()
      };
      setPages(newPages);
    }
  };

  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || pages.some(page => !page.content)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const postDoc = doc(db, "posts", id);
      await updateDoc(postDoc, {
        title: title,
        pages: pages,
        tags: tags,
        published: published,
        updatedAt: new Date().toISOString(),
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again later.");
    }
  };

  const renderPageButtons = () => {
    const totalPages = pages.length;
    const pageButtons = [];

    const addPageButton = (index) => {
      pageButtons.push(
        <button
          key={index}
          type="button"
          onClick={() => handlePageChange(index)}
          className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          {index + 1}
        </button>
      );
    };

    // Always show first page
    addPageButton(0);

    if (totalPages > 7) {
      if (currentPage > 2) pageButtons.push(<span key="ellipsis1">...</span>);

      // Show current page and one page before and after
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 2); i++) {
        addPageButton(i);
      }

      if (currentPage < totalPages - 3) pageButtons.push(<span key="ellipsis2">...</span>);
    } else {
      // If 7 or fewer pages, show all pages
      for (let i = 1; i < totalPages - 1; i++) {
        addPageButton(i);
      }
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      addPageButton(totalPages - 1);
    }

    return pageButtons;
  };

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <div className="flex space-x-2 mb-2 overflow-x-auto">
            {renderPageButtons()}
            <button
              type="button"
              onClick={addNewPage}
              className="px-3 py-1 rounded bg-secondary text-white"
            >
              +
            </button>
          </div>
          <textarea
            id="content"
            value={pages && pages[currentPage] ? pages[currentPage].content : ""}
            onChange={(e) => updatePageContent(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="12"
            maxLength={MAX_CHARS_PER_PAGE}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {pages && pages[currentPage] ? pages[currentPage].content.length : 0} / {MAX_CHARS_PER_PAGE} characters
          </p>
        </div>
        {/* Tags and Publish sections remain unchanged */}
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