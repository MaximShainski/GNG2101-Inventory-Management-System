import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LoginForm from './LoginForm';
import ItemList from './ItemList';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // New state for logout flag

  const handleLogout = async () => {
    try {
      window.history.replaceState({}, document.title, window.location.origin);
      await signOut(auth);
      setIsLoggedIn(false);
      setIsLoggingOut(true); // Set the logout flag
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {isLoggedIn ? (
        <div>
          <ItemList />
          <button onClick={handleLogout}>Log Out</button>
        </div>
      ) : (
        <LoginForm setIsLoggedIn={setIsLoggedIn} />
      )}
    </>
  );
}

export default App;
