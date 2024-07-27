import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBDAQ04Uc9nsuGYUJiiapQN0K1oI1VRvIU",
  authDomain: "blog-99919.firebaseapp.com",
  projectId: "blog-99919",
  storageBucket: "blog-99919.appspot.com",
  messagingSenderId: "624125159696",
  appId: "1:624125159696:web:66b5ebe553b52a61271d95"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

// getUserAuthorName 関数の実装
const getUserAuthorName = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  return userDoc.exists() ? userDoc.data().authorName : null;
};

// setUserAuthorName 関数の実装
const setUserAuthorName = async (userId, authorName) => {
  await setDoc(doc(db, "users", userId), { authorName }, { merge: true });
};

export { db, auth, provider, storage, getUserAuthorName, setUserAuthorName };


