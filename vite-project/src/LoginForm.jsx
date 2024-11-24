import { useState, useEffect } from 'react';
import { setPersistence, inMemoryPersistence, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, Loader2 } from "lucide-react";

const LoginForm = ({ setIsLoggedIn, setUserEmail, checkPasswordForRedirect  }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (emailToLogin, passwordToLogin) => {
    try {
      setLoading(true);
      setError('');
      await setPersistence(auth, inMemoryPersistence);
      console.log('Attempting to sign in with:', emailToLogin, passwordToLogin);
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, passwordToLogin);
      setIsLoggedIn(true);
      setUserEmail(userCredential.user.email); // Store the email
      checkPasswordForRedirect(password);
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginNoParameter = async (e) => {
    e.preventDefault(); // Prevent form submission
    try {
      setLoading(true);
      setError('');
      await setPersistence(auth, inMemoryPersistence);
      console.log('Attempting to sign in with number 2:', email, password);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setIsLoggedIn(true);
      setUserEmail(userCredential.user.email); // Store the email
      checkPasswordForRedirect(password);
    } catch (error) {
      console.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = decodeURIComponent(urlParams.get('email'));
    const passwordParam = decodeURIComponent(urlParams.get('password'));

    if (emailParam) {
      console.log("emailParam", emailParam);
      setEmail(emailParam);
    }

    if (passwordParam) {
      setPassword(passwordParam);
    }

    if (emailParam != 'null' && passwordParam != 'null') {
      console.log('got here');
      handleLogin(emailParam, passwordParam);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLoginNoParameter} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;