import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../App';
import { AlertCircle } from 'lucide-react';
import PageHero from '../components/PageHero';

const LOGIN_HERO_IMAGES = [
  'https://images.pexels.com/photos/38466430/pexels-photo-38466430.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/31372128/pexels-photo-31372128.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/19227220/pexels-photo-19227220.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

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
      if (err.message === 'Email not confirmed') {
        setError('이메일 인증이 아직 완료되지 않았습니다. 가입 시 받으신 인증 메일의 링크를 먼저 클릭해주세요.');
      } else if (err.message === 'Invalid login credentials') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        images={LOGIN_HERO_IMAGES}
        eyebrow="WELCOME BACK"
        title="다시 만나 반가워요"
        subtitle="로그인하고 위로자들을 위한 쉼터를 이어가세요"
      />
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

      <style>{`
        @media (max-width: 768px) {
          .signup-form {
            padding: 1.75rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .signup-container {
            padding: 1rem 0;
          }

          .signup-form {
            padding: 1.5rem 1.25rem;
          }

          .signup-form .subtitle {
            font-size: 0.9rem;
          }

          .signup-form .btn-primary {
            min-height: 44px;
          }
        }
      `}</style>
      </div>
    </>
  );
}

export default Login;
