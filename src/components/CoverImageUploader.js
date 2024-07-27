import React, { useState, useEffect } from 'react';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const CoverImageUploader = ({ postId, existingCoverImage, onCoverImageUpload, onCoverImageDelete }) => {
  const [coverImage, setCoverImage] = useState(existingCoverImage);

  useEffect(() => {
    setCoverImage(existingCoverImage);
  }, [existingCoverImage]);

  const validateCoverImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > 512 || img.height > 512) {
            reject('表紙画像のサイズは512x512以下である必要があります。');
          } else if (file.size > 5 * 1024 * 1024) {
            reject('表紙画像のサイズは5MB以下である必要があります。');
          } else {
            resolve();
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadCoverImage = async (file) => {
    if (!auth.currentUser) {
      alert('表紙画像をアップロードするにはログインが必要です。');
      return;
    }

    try {
      await validateCoverImage(file);
      const imageRef = ref(storage, `covers/${postId}/${Date.now()}_${file.name}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      const newCoverImage = { id: imageRef.fullPath, url: downloadURL };
      setCoverImage(newCoverImage);
      onCoverImageUpload(newCoverImage);
    } catch (error) {
      alert(error);
    }
  };

  const deleteCoverImage = async () => {
    if (!auth.currentUser) {
      alert('表紙画像を削除するにはログインが必要です。');
      return;
    }

    if (coverImage) {
      try {
        const imageRef = ref(storage, coverImage.id);
        await deleteObject(imageRef);
        setCoverImage(null);
        onCoverImageDelete();
      } catch (error) {
        console.error('表紙画像の削除中にエラーが発生しました:', error);
        alert('表紙画像の削除に失敗しました。もう一度お試しください。');
      }
    }
  };

  const downloadCoverImage = () => {
    if (coverImage) {
      const link = document.createElement('a');
      link.href = coverImage.url;
      link.download = 'cover_image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="cover-image-uploader">
      <h3>表紙画像</h3>
      <input 
        type="file" 
        accept=".jpg,.jpeg" 
        onChange={(e) => uploadCoverImage(e.target.files[0])}
      />
      {coverImage && (
        <div className="cover-image-preview">
          <img src={coverImage.url} alt="表紙" style={{ maxWidth: '100px' }} />
          <button onClick={deleteCoverImage}>削除</button>
          <button onClick={downloadCoverImage}>ダウンロード</button>
        </div>
      )}
    </div>
  );
};

export default CoverImageUploader;