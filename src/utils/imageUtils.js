import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_IMAGE_SIZE = 512;
const MAX_FILE_SIZE = 300 * 1024; // 300kB

export const validateAndResizeImage = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      reject('Only JPG and PNG images are allowed.');
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      let needsResize = false;

      if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        if (width > height) {
          height *= MAX_IMAGE_SIZE / width;
          width = MAX_IMAGE_SIZE;
        } else {
          width *= MAX_IMAGE_SIZE / height;
          height = MAX_IMAGE_SIZE;
        }
        needsResize = true;
      }

      if (needsResize || file.size > MAX_FILE_SIZE) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob.size <= MAX_FILE_SIZE) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              reject('Unable to resize image to meet the size requirement.');
            }
          },
          file.type,
          0.7
        );
      } else {
        resolve(file);
      }
    };
    img.onerror = () => reject('Invalid image file.');
    img.src = URL.createObjectURL(file);
  });
};

export const uploadImage = async (file, path) => {
  const validatedFile = await validateAndResizeImage(file);
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, validatedFile);
  return await getDownloadURL(imageRef);
};

export const deleteImage = async (path) => {
  const imageRef = ref(storage, path);
  await deleteObject(imageRef);
};

export const downloadImage = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};