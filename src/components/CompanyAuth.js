// src/components/CompanyAuth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../styles/AuthShared.css';
import { useNavigate } from 'react-router-dom';

const CompanyAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login - no email verification required
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/company-dashboard');
      } else {
        // Registration with email verification
        if (!agreeToRules) throw new Error('You must agree to follow the platform rules.');
        if (!purpose.trim()) throw new Error('Please describe your purpose.');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Save company data (user is not fully verified yet, but we store the data)
        await setDoc(doc(db, 'companies', user.uid), {
          name: email.split('@')[0], // Temporary name
          email: user.email,
          purpose,
          role: 'Company',
          isActive: false,           // ✅ Not active until email is verified
          emailVerified: false,      // ✅ Track email verification status
          createdAt: new Date(),
          updatedAt: new Date(),
          logoUrl: '',              // ✅ Field for logo (empty string if not uploaded)
          location: '',
          contact: '',
          industry: '',
          description: ''
        });

        setSuccessMessage('Registration successful! Please check your email to verify your account before logging in.');
        
        // Don't navigate to dashboard yet - wait for email verification
        // User will need to verify email first, then login separately
      }
    } catch (err) {
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Incorrect email or password.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? 'Company Login' : 'Company Registration'}</h2>
        {error && <div className="auth-error">{error}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Company Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {!isLogin && (
            <>
              <div className="auth-form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={agreeToRules}
                    onChange={(e) => setAgreeToRules(e.target.checked)}
                  />
                  I agree to follow all platform rules
                </label>
              </div>
              <div className="auth-form-group">
                <label>Purpose of using this platform</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>
            </>
          )}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="auth-toggle">
          <button type="button" className="auth-link-btn" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyAuth;