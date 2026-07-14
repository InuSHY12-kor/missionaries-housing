import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { Upload, AlertCircle } from 'lucide-react';

function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
    role: 'missionary', // 'missionary' or 'host'
    churchName: '',
    churchAddress: '',
    phone: '',
    verificationFiles: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      verificationFiles: [...prev.verificationFiles, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      verificationFiles: prev.verificationFiles.filter((_, i) => i !== index)
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

      if (!formData.fullName || !formData.churchName) {
        throw new Error('필수 정보를 모두 입력해주세요.');
      }

      if (formData.verificationFiles.length === 0) {
        throw new Error('검증 문서를 최소 1개 이상 제출해주세요.');
      }

      // 1. 사용자 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. 파일 업로드
      const uploadedFileUrls = [];
      for (let i = 0; i < formData.verificationFiles.length; i++) {
        const file = formData.verificationFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        uploadedFileUrls.push(fileName);
      }

      // 3. 사용자 프로필 생성
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: formData.email,
          full_name: formData.fullName,
          role: formData.role,
          church_name: formData.churchName,
          church_address: formData.churchAddress,
          phone: formData.phone,
          status: 'pending',
          verification_docs: uploadedFileUrls,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setSuccess('가입이 완료되었습니다! 관리자 승인 후 이용할 수 있습니다.');
      setTimeout(() => {
        navigate('/');
      }, 2000);

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
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 역할 선택 */}
            <div className="form-group">
              <label>회원 유형 *</label>
              <div className="role-selector">
                <label className={`role-option ${formData.role === 'missionary' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="missionary"
                    checked={formData.role === 'missionary'}
                    onChange={handleInputChange}
                  />
                  <span>선교사 (숙소 예약)</span>
                </label>
                <label className={`role-option ${formData.role === 'host' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="host"
                    checked={formData.role === 'host'}
                    onChange={handleInputChange}
                  />
                                    <span>숙소 제공자 (숙소 제공)</span>
                </label>
              </div>
            </div>

            {/* 기본 정보 */}
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
              <label>성명 *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="홍길동"
                required
              />
            </div>

            <div className="form-group">
              <label>전화번호 *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="010-1234-5678"
                required
              />
            </div>

            <div className="form-group">
              <label>소속 교회 *</label>
              <input
                type="text"
                name="churchName"
                value={formData.churchName}
                onChange={handleInputChange}
                placeholder="교회명"
                required
              />
            </div>

            <div className="form-group">
              <label>교회 주소</label>
              <input
                type="text"
                name="churchAddress"
                value={formData.churchAddress}
                onChange={handleInputChange}
                placeholder="서울시 강남구..."
              />
            </div>

            {/* 비밀번호 */}
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

            {/* 검증 문서 */}
            <div className="form-group">
              <label>검증 문서 (사진) *</label>
              <p className="help-text">
                선교사증, 목사증, 교회 추천서 등을 촬영하여 업로드해주세요.
                (최소 1개, 최대 5개)
              </p>
              <div className="file-upload">
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={formData.verificationFiles.length >= 5}
                />
                <label htmlFor="file-input" className="file-label">
                  <Upload size={24} />
                  <span>파일을 선택하거나 드래그하세요</span>
                </label>
              </div>

              {formData.verificationFiles.length > 0 && (
                <div className="file-list">
                  <h4>업로드된 파일 ({formData.verificationFiles.length}/5)</h4>
                  <ul>
                    {formData.verificationFiles.map((file, index) => (
                      <li key={index}>
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="remove-btn"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 약관 */}
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

          <p className="login-link">
            이미 계정이 있으신가요? <a href="/">로그인</a>
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

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .role-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .role-option input {
          cursor: pointer;
        }

        .role-option.active {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .help-text {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-top: 0.5rem;
        }

        .file-upload {
          border: 2px dashed #667eea;
          border-radius: 6px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f8faff;
        }

        .file-upload:hover {
          background: #f0f4ff;
          border-color: #764ba2;
        }

        .file-upload input {
          display: none;
        }

        .file-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #667eea;
        }

        .file-list {
          margin-top: 1rem;
        }

        .file-list h4 {
          margin-bottom: 0.75rem;
          color: #2c3e50;
        }

        .file-list ul {
          list-style: none;
        }

        .file-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .remove-btn {
          background: #e74c3c;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
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

          .role-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default SignUp;
