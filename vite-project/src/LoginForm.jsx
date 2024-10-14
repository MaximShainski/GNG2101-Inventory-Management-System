import { useState, useEffect } from 'react';
import { setPersistence, inMemoryPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LoginForm = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
    //This was necessary because it wouldn't load fast enough (or maybe something else)
  const handleLogin = async (emailToLogin, passwordToLogin) => {
    try {
      //Makes it so that users aren't automatically signed back in
      await setPersistence(auth, inMemoryPersistence);
      //Wait for the query with firebase to sign in using the given parameters
      console.log('Attempting to sign in with:', emailToLogin, passwordToLogin);
      await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleLoginNoParameter = async () => {
    try {
      //Makes it so that users aren't automatically signed back in
      await setPersistence(auth, inMemoryPersistence);
      //Wait for the query with firebase to sign in using the given parameters
      console.log('Attempting to sign in with number 2:', emailToLogin, passwordToLogin);
      await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = decodeURIComponent(urlParams.get('email'));
    const passwordParam = decodeURIComponent(urlParams.get('password'));

    if (emailParam) {
      console.log("emailParam", email);
      setEmail(emailParam);
      console.log("email param", email);
    }

    if (passwordParam) {
      setPassword(passwordParam);
    }
    if (emailParam && passwordParam) {
        console.log('got here');
        handleLogin(emailParam, passwordParam); 
      }
  }, []);
  return (
    <div>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLoginNoParameter}>Log In</button>
    </div>
  );
};

export default LoginForm;
