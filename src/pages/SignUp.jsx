import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { AlertCircle, Mail } from 'lucide-react';

function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: ''
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
    setSuccess('');
    setLoading(true);

    try {
      // 유효성 검사
      if (!formData.email || !formData.password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }

      if (formData.password !== formData.passwordConfirm) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      if (formData.password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }

      // 계정 생성 (이메일 인증 필요)
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      setSuccess('가입 신청이 접수되었습니다! 입력하신 이메일로 인증 링크를 보내드렸습니다. 이메일 인증을 완료한 뒤 로그인하시면 프로필 등록을 진행할 수 있습니다.');
      setFormData({ email: '', password: '', passwordConfirm: '' });
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
          <h1>가입하기</h1>
          <p className="subtitle">선교사 커뮤니티에 참여하세요</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <Mail size={20} />
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
                  placeholder="6자 이상"
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
                <label className="checkbox">
                  <input type="checkbox" required />
                  <span>이용약관에 동의합니다</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '가입 중...' : '가입하기'}
              </button>
            </form>
          )}

          <p className="login-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
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

        .login-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #7f8c8d;
        }

        .login-link a {
          color: #667eea;
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
  );
}

export default SignUp;
