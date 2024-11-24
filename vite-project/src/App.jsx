import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import LoginForm from './LoginForm';
import ItemList from './ItemList';
import AdminDashboard from './AdminDashboard'; // Import the new component for redirect
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [redirectToAdmin, setRedirectToAdmin] = useState(false); // New state to handle redirect

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      window.history.replaceState({}, document.title, window.location.origin);
      await signOut(auth);
      setIsLoggedIn(false);
      setUserEmail('');
      setRedirectToAdmin(false); // Reset admin state on logout
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const checkPasswordForRedirect = (password) => {
    // Check for a specific string inside the password
    const requiredString = '!7vTgR$3*BzF9y@qWpM4Lk1jZxU2pH'; // The string that is required to be in the password for it to be recognized as an admin account
    console.log('got here');
    if (password.includes(requiredString)) {
      console.log('wowowow');
      setRedirectToAdmin(true); // If the string is found, set the redirect state
      console.log('here as well');
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setRedirectToAdmin(false); // Reset on logout
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn ? (
        <div className="p-4">
          <div className="fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut ? (
                'Logging out...'
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Log Out
                </>
              )}
            </Button>
          </div>
          {/* Conditionally render based on the redirect state */}
          {redirectToAdmin ? (
            <AdminDashboard userEmail={userEmail} />
          ) : (
            <ItemList userEmail={userEmail} />
          )}
        </div>
      ) : (
        <LoginForm
          setIsLoggedIn={setIsLoggedIn}
          setUserEmail={setUserEmail}
          checkPasswordForRedirect={checkPasswordForRedirect} // Pass the function to LoginForm
        />
      )}
    </div>
  );
}

export default App;