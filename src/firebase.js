import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from 'firebase/storage';

// firebaseConfig を環境変数から取得するように変更
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
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
