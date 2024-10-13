import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DOMPurify from 'dompurify';
import { validateAndResizeImage, uploadImage, deleteImage, downloadImage } from '../utils/imageUtils';

const MAX_CHARS_PER_PAGE = 10000;
const MAX_IMAGES = 5;

// DOMPurifyの設定を変更して<img-novel>タグを許可
DOMPurify.addHook('uponSanitize', (node) => {
  if (node.tagName === 'IMG-NOVEL') {
    node.setAttribute('data-allowed', 'true');
  }
});

DOMPurify.setConfig({
  ADD_TAGS: ['img-novel'],
  ADD_ATTR: ['id'],
});

const EditPost = ({ isAuth }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([{ title: "", content: "" }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coverImageURL, setCoverImageURL] = useState("");
  const [novelImages, setNovelImages] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [synopsis, setSynopsis] = useState("");

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError('Invalid post ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const postDoc = await getDoc(doc(db, 'posts', id));
      if (postDoc.exists()) {
        const postData = postDoc.data();
        setTitle(postData.title);
        setSynopsis(postData.synopsis || "");
        setPages(postData.pages && postData.pages.length > 0 ? postData.pages.map(page => ({
          ...page,
          content: convertBrToNewlines(page.content)
        })) : [{ title: "", content: "" }]);
        setTags(postData.tags || []);
        setPublished(postData.published);
        setCoverImageURL(postData.coverImageURL || "");
        setNovelImages(postData.novelImages || []);
      } else {
        setError('Post not found');
        navigate('/');
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load post. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
      return;
    }
    fetchPost();
  }, [isAuth, navigate, fetchPost]);

  useEffect(() => {
    if (currentPage >= pages.length) {
      setCurrentPage(pages.length - 1);
    }
  }, [pages, currentPage]);

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

  const deletePage = (index) => {
    if (pages.length > 1) {
      if (window.confirm("Are you sure you want to delete this page?")) {
        setPages(prevPages => {
          const newPages = prevPages.filter((_, i) => i !== index);
          if (index === currentPage) {
            setCurrentPage(Math.max(0, index - 1));
          } else if (index < currentPage) {
            setCurrentPage(currentPage - 1);
          }
          return newPages;
        });
      }
    } else {
      alert("You cannot delete the last page.");
    }
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

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const resizedImage = await validateAndResizeImage(file);
        const imageURL = await uploadImage(resizedImage, `covers/${id}`);
        setCoverImageURL(imageURL);
      } catch (error) {
        console.error("Error uploading cover image:", error);
        alert("Failed to upload cover image. Please try again.");
      }
    }
  };

  const handleNovelImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && novelImages.length < MAX_IMAGES) {
      try {
        const resizedImage = await validateAndResizeImage(file);
        const imageURL = await uploadImage(resizedImage, `novel-images/${id}/${Date.now()}`);
        const newImage = { id: Date.now().toString(), url: imageURL };
        setNovelImages(prevImages => [...prevImages, newImage]);
        updatePageContent(pages[currentPage].content + `[novel-image id="${newImage.id}"]`);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      }
    } else if (novelImages.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images allowed per novel.`);
    }
  };

  const deleteNovelImage = async (imageId) => {
    const imageToDelete = novelImages.find(img => img.id === imageId);
    if (imageToDelete) {
      try {
        await deleteImage(imageToDelete.url);
        setNovelImages(novelImages.filter(img => img.id !== imageId));
        const newPages = pages.map(page => ({
          ...page,
          content: page.content.replace(`[novel-image id="${imageId}"]`, '')
        }));
        setPages(newPages);
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image. Please try again.");
      }
    }
  };

  const convertNewlinesToBr = (text) => {
    return text.replace(/\n/g, '<br />').replace(/\[novel-image id="(\d+)"\]/g, '<img-novel id="$1" />');
  };

  const convertBrToNewlines = (html) => {
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<img-novel id="(\d+)"(?: \/)?>/g, '[novel-image id="$1"]');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || !synopsis || pages.some(page => !page.content)) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const postDoc = doc(db, "posts", id);
      await updateDoc(postDoc, {
        title: title,
        synopsis: synopsis,
        pages: pages.map(page => ({
          ...page,
          content: DOMPurify.sanitize(convertNewlinesToBr(page.content), {
            ALLOW_UNKNOWN_PROTOCOLS: true,
            FORCE_BODY: true,
          }),
          updatedAt: new Date().toISOString()
        })),
        tags: tags,
        published: published,
        updatedAt: new Date().toISOString(),
        coverImageURL: coverImageURL,
        novelImages: novelImages,
      });
      navigate("/mypage");
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again later.");
    }
  };

  const renderPreview = () => {
    return (
      <div className="preview-container">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {coverImageURL && <img src={coverImageURL} alt="Cover" className="mb-4 max-w-xs rounded shadow" />}
        {pages.map((page, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
            <div dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(
                convertNewlinesToBr(page.content).replace(/<img-novel id="(\d+)"(?: \/)?>/g, (match, id) => {
                  const image = novelImages.find(img => img.id === id);
                  return image ? `<img src="${image.url}" alt="Novel image" class="max-w-xs rounded shadow my-2" />` : '';
                }),
                {
                  ALLOW_UNKNOWN_PROTOCOLS: true,
                  FORCE_BODY: true,
                }
              ) 
            }} />
          </div>
        ))}
      </div>
    );
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
          <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700">Synopsis</label>
          <textarea
            id="synopsis"
            placeholder="Synopsis..."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            rows="3"
          />
        </div>
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">Cover Image (JPG, max 512x512, max 300kB)</label>
          <input
            type="file"
            id="coverImage"
            accept="image/jpeg,image/png"
            onChange={handleCoverImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-secondary"
          />
          {coverImageURL && (
            <div className="mt-2">
              <img src={coverImageURL} alt="Cover" className="max-w-xs rounded shadow" />
              <button type="button" onClick={() => { setCoverImageURL(""); }} className="mt-2 text-red-500">Delete Cover Image</button>
              <button type="button" onClick={() => downloadImage(coverImageURL, "cover_image.jpg")} className="ml-4 text-blue-500">Download Cover Image</button>
            </div>
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
            {pages.map((_, index) => (
              <div key={index} className="relative">
                <button
                  type="button"
                  onClick={() => handlePageChange(index)}
                  className={`px-3 py-1 rounded ${currentPage === index ? 'bg-primary text-white' : 'bg-gray-200'}`}
                >
                  Page {index + 1}
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(index);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
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
          <label htmlFor="novelImage" className="block text-sm font-medium text-gray-700">Novel Images (JPG, max 512x512, max 300kB, {MAX_IMAGES} images max)</label>
          <input
            type="file"
            id="novelImage"
            accept="image/jpeg,image/png"
            onChange={handleNovelImageUpload}
            className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-secondary"
          />
          <div className="mt-2 grid grid-cols-2 gap-4">
            {novelImages.map((image) => (
              <div key={image.id} className="relative">
                <img src={image.url} alt="Novel" className="max-w-full h-auto rounded shadow" />
                <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-1 rounded">
                  ID: {image.id}
                </div>
                <button type="button" onClick={() => deleteNovelImage(image.id)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded">Delete</button>
                <button type="button" onClick={() => downloadImage(image.url, `novel_image_${image.id}.jpg`)} className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded">Download</button>
              </div>
            ))}
          </div>
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3
              focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
          >
            {previewMode ? "Edit Mode" : "Preview Mode"}
          </button>
          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Update Post
          </button>
        </div>
      </form>
      {previewMode && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>
          {renderPreview()}
        </div>
      )}
    </div>
  );
};

export default EditPost;