import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const MAX_CHARS_PER_PAGE = 10000;
const MAX_IMAGE_SIZE = 512; // 最大画像サイズ

const EditPost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([{ title: "", content: "", createdAt: "", updatedAt: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageURL, setCoverImageURL] = useState("");
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
          setPages(data.pages && data.pages.length > 0 ? data.pages : [{ title: "", content: "", createdAt: "", updatedAt: "" }]);
          setTags(data.tags || []);
          setPublished(data.published);
          setCoverImageURL(data.coverImageURL || "");
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
      title: "",
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

  const updatePageTitle = (title) => {
    if (pages && currentPage >= 0 && currentPage < pages.length) {
      const newPages = [...pages];
      newPages[currentPage] = {
        ...newPages[currentPage],
        title: title,
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let width = img.width;
          let height = img.height;

          // 画像のリサイズ
          if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
            if (width > height) {
              height *= MAX_IMAGE_SIZE / width;
              width = MAX_IMAGE_SIZE;
            } else {
              width *= MAX_IMAGE_SIZE / height;
              height = MAX_IMAGE_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            setCoverImage(blob);
            setCoverImageURL(URL.createObjectURL(blob));
          }, 'image/jpeg', 0.95);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || pages.some(page => !page.content)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      let coverImageURL = "";
      if (coverImage) {
        const imageRef = ref(storage, `covers/${id}`);
        await uploadBytes(imageRef, coverImage);
        coverImageURL = await getDownloadURL(imageRef);
      }

      const postDoc = doc(db, "posts", id);
      await updateDoc(postDoc, {
        title: title,
        pages: pages,
        tags: tags,
        published: published,
        updatedAt: new Date().toISOString(),
        coverImageURL: coverImageURL || null,
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again later.");
    }
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Post Title</label>
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
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">Cover Image</label>
          <input
            type="file"
            id="coverImage"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-secondary"
          />
          {coverImageURL && (
            <img src={coverImageURL} alt="Cover" className="mt-4 max-w-xs rounded shadow" />
          )}
        </div>
        <div>
          <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700">Page Title</label>
          <input
            type="text"
            id="pageTitle"
            value={pages[currentPage]?.title || ""}
            onChange={(e) => updatePageTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
          <div className="flex space-x-2 mb-2 overflow-x-auto">
            {pages.map((page, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePageChange(index)}
                className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
              >
                {page.title || `Page ${index + 1}`}
              </button>
            ))}
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
            value={pages[currentPage]?.content || ""}
            onChange={(e) => updatePageContent(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="12"
            maxLength={MAX_CHARS_PER_PAGE}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {pages[currentPage]?.content.length || 0} / {MAX_CHARS_PER_PAGE} characters
          </p>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="flex items-center">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-primary"
            >
              Add Tag
            </button>
          </div>
          <div className="mt-2 flex flex-wrap">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
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