import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../App';
import { AlertCircle } from 'lucide-react';
import { MISSIONARY_TERMS, HOST_TERMS } from '../data/termsOfService';
import PageHero from '../components/PageHero';

const SIGNUP_HERO_IMAGES = [
  'https://images.pexels.com/photos/37913935/pexels-photo-37913935.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/30135556/pexels-photo-30135556.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/8532289/pexels-photo-8532289.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

const ROLE_META = {
  missionary: {
    title: '선교사 가입하기',
    subtitle: '숙소가 필요한 선교사님, 환영합니다',
    terms: MISSIONARY_TERMS
  },
  host: {
    title: '숙소 제공자 가입하기',
    subtitle: '선교사님을 위해 숙소를 나눠주셔서 감사합니다',
    terms: HOST_TERMS
  }
};

function SignUp({ role }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const meta = ROLE_META[role] || ROLE_META.missionary;

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
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      if (formData.password !== formData.passwordConfirm) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      if (formData.password.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.');
      }

      if (!agreed) {
        throw new Error('이용약관에 동의해주세요.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // 이메일 인증 링크를 클릭하면 프로필 등록 페이지로 돌아오도록 설정
          emailRedirectTo: `${window.location.origin}/complete-profile`,
          data: {
            role
          }
        }
      });

      if (authError) throw authError;

      if (authData.session) {
        // 이메일 인증이 꺼져 있는 등, 가입과 동시에 로그인 세션이 생성된 경우
        // → 바로 다음 단계(프로필 등록)로 이동
        navigate('/complete-profile');
      } else {
        // 이메일 인증이 필요한 경우 → 인증 안내 메시지 표시, 링크 클릭 후 자동으로 다음 단계 진행됨
        setSuccess(
          `${formData.email} 주소로 인증 메일을 보내드렸습니다. 메일함(스팸함 포함)을 확인하고 인증 링크를 클릭해주세요. 인증 후 자동으로 다음 단계(프로필 등록)로 이동합니다.`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        images={SIGNUP_HERO_IMAGES}
        eyebrow="JOIN US"
        title={meta.title}
        subtitle={meta.subtitle}
      />
      <div className="signup-container">
      <div className="container">
        <div className="signup-form">
          <h1>{meta.title}</h1>
          <p className="subtitle">{meta.subtitle}</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>{success}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>이메일 *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
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
                  placeholder="8자 이상"
                  required
                />
              </div>

              <div className="form-group">
                <label>비밀번호 확인 *</label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>

              <div className="form-group">
                <label>이용약관 *</label>
                <div className="terms-box" tabIndex={0}>
                  {meta.terms}
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                  />
                  <span>위 이용약관에 동의합니다</span>
                </label>
              </div>

              <p className="field-hint">
                이메일과 비밀번호로 먼저 가입하고, 다음 단계에서 성명·연락처·소속 교회·증빙 자료를 등록합니다.
              </p>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '가입 중...' : '가입하기'}
              </button>
            </form>
          )}

          <div className="login-link">
            <Link to="/signup">← 가입 유형 다시 선택하기</Link>
            <span className="divider">|</span>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>

      <style>{`
        .signup-container {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 2rem 0;
        }

        .signup-form {
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
        }

        .field-hint {
          margin-top: -0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          color: #888;
        }

        .signup-form h1 {
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 2rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .alert-error {
          background: #fadbd8;
          color: #c0392b;
          border: 1px solid #e74c3c;
        }

        .alert-success {
          background: #d5f4e6;
          color: #27ae60;
          border: 1px solid #27ae60;
        }

        .terms-box {
          height: 180px;
          overflow-y: auto;
          border: 1px solid #dfe6e9;
          border-radius: 6px;
          padding: 1rem;
          background: #f8f9fa;
          color: #555;
          font-size: 0.85rem;
          line-height: 1.7;
          white-space: pre-wrap;
          margin-bottom: 0.75rem;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .checkbox input {
          cursor: pointer;
          width: auto;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #bdc3c7;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #d97b3f;
          box-shadow: 0 0 0 3px rgba(217, 123, 63, 0.1);
        }

        .login-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #7f8c8d;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .login-link .divider {
          color: #dfe6e9;
        }

        .login-link a {
          color: #d97b3f;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .signup-form {
            padding: 1.5rem;
          }
        }
      `}</style>
      </div>
    </>
  );
}

export default SignUp;
