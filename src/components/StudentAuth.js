// src/components/StudentAuth.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import '../styles/AuthShared.css';
import { useNavigate } from 'react-router-dom';

const StudentAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToRules, setAgreeToRules] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/student-dashboard'); // ✅ Redirect after login
      } else {
        if (!agreeToRules) throw new Error('You must agree to follow the platform rules.');
        if (!purpose.trim()) throw new Error('Please describe your purpose.');

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'students', user.uid), {
          email: user.email,
          purpose,
          createdAt: new Date(),
          role: 'Student'
        });

        navigate('/student-dashboard'); // ✅ Redirect after register
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? 'Student Login' : 'Student Registration'}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Email</label>
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
                  <input type="checkbox" checked={agreeToRules} onChange={(e) => setAgreeToRules(e.target.checked)} />
                  I agree to follow all platform rules
                </label>
              </div>
              <div className="auth-form-group">
                <label>Purpose</label>
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

export default StudentAuth;
