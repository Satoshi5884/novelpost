import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import Home from './components/Home';
import CreatePost from './components/CreatePost';
import Login from './components/Login';
import Logout from './components/Logout';
import Navbar from './components/Navbar';
import MyPage from './components/MyPage';
import EditPost from './components/EditPost';

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('isAuth') === 'true');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuth(true);
        localStorage.setItem('isAuth', 'true');
      } else {
        setIsAuth(false);
        localStorage.setItem('isAuth', 'false');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar isAuth={isAuth} />
        <Routes>
          <Route path="/" element={<Home isAuth={isAuth} />} />
          <Route path="/createpost" element={<CreatePost isAuth={isAuth} />} />
          <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
          <Route path="/logout" element={<Logout setIsAuth={setIsAuth} />} />
          <Route path="/mypage" element={<MyPage isAuth={isAuth} />} />
          <Route path="/edit/:id" element={<EditPost isAuth={isAuth} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;