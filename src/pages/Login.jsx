import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../App';
import { AlertCircle } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) throw signInError;

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="container">
        <div className="signup-form">
          <h1>로그인</h1>
          <p className="subtitle">선교사 커뮤니티에 다시 오신 것을 환영합니다</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>이메일 *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호 *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="subtitle" style={{ marginTop: '1rem' }}>
            계정이 없으신가요? <Link to="/signup">가입하기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
