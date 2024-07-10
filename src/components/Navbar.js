import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ isAuth }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-primary">NovelPost</Link>
          </div>
          <div className="flex items-center">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">Home</Link>
            {!isAuth ? (
              <Link to="/login" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-secondary">Login</Link>
            ) : (
              <>
                <Link to="/createpost" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">Create Post</Link>
                <Link to="/mypage" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">My Page</Link>
                <Link to="/logout" className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-secondary">Logout</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;