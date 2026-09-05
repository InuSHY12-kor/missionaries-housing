import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import { Upload, AlertCircle } from 'lucide-react';
import PageHero from '../components/PageHero';
import { formatPhoneNumber } from '../utils/phone';

const COMPLETE_PROFILE_HERO_IMAGES = [
  'https://images.pexels.com/photos/30851143/pexels-photo-30851143.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/32081456/pexels-photo-32081456.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/33497885/pexels-photo-33497885.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

function CompleteProfile() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    role: 'missionary', // 'missionary' or 'host'
    churchName: '',
    churchAddress: '',
    phone: '',
    bio: '',
    verificationFiles: []
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email);

      // 가입 시 선택한 회원 유형이 있다면 미리 채워둠
      // (Phase 6) supporter(후원자)는 서류 심사 없이 즉시 승인되는 별도 흐름이라
      // 아래 handleSubmit / 화면 렌더링에서 role별로 분기합니다.
      const metaRole = session.user.user_metadata?.role;
      if (metaRole === 'missionary' || metaRole === 'host' || metaRole === 'supporter') {
        setFormData(prev => ({ ...prev, role: metaRole }));
      }

      // 이미 프로필이 있다면 다시 등록할 필요 없음
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (existingProfile) {
        navigate('/');
        return;
      }

      setChecking(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // 전화번호는 입력하는 즉시 010-0000-0000 형태로 자동 하이픈을 넣어줍니다.
      [name]: name === 'phone' ? formatPhoneNumber(value) : value
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

  // (Phase 6) 후원자(supporter)는 서류 제출 없이 즉시 이용 가능(자동 승인)하도록 확정되어,
  // 선교사/호스트와는 완전히 다른(훨씬 짧은) 제출 흐름을 갖습니다. 아래에서 role로 분기합니다.
  const handleSupporterSubmit = async () => {
    if (!formData.fullName) {
      throw new Error('성명을 입력해주세요.');
    }

    // 회원가입(SupporterSignup.jsx) 단계에서 이미 이메일 인증 메일 발송 + 인증 링크 클릭을
    // 거쳐야만 이 화면(세션 있음)에 도달하므로, 여기서는 관리자 승인 대기 없이 바로
    // status: 'approved'로 프로필을 생성합니다. email_verified_at도 함께 채워서
    // App.jsx의 "이메일 인증 대기" 화면(PendingApproval)에 걸리지 않도록 합니다 —
    // 선교사/호스트가 프로필 등록 후 별도로 거치는 2차 이메일 인증(커스텀 토큰 링크)은
    // 후원자에게는 적용하지 않는 의도적인 설계입니다.
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userEmail,
        full_name: formData.fullName,
        role: 'supporter',
        church_name: null,
        church_address: null,
        phone: formData.phone || null,
        bio: null,
        status: 'approved',
        verification_docs: [],
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // 관리자에게 신규 후원자 가입을 알리는 참고용 알림 메일 (승인 액션이 필요한 것은 아님).
    // 실패해도 가입 자체는 이미 완료된 것이므로 무시하고 계속 진행합니다.
    try {
      await supabase.functions.invoke('send-email', {
        body: { type: 'admin_new_signup', userId }
      });
    } catch (emailErr) {
      console.error('알림 메일 발송 오류:', emailErr);
    }

    window.location.href = '/stay/signup-complete?role=supporter';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.role === 'supporter') {
        await handleSupporterSubmit();
        return;
      }

      if (!formData.fullName || !formData.churchName) {
        throw new Error('필수 정보를 모두 입력해주세요.');
      }

      if (formData.verificationFiles.length === 0) {
        throw new Error('검증 문서를 최소 1개 이상 제출해주세요.');
      }

      // 1. 파일 업로드 (로그인 상태이므로 RLS 통과)
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

      // 2. 프로필 생성
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          full_name: formData.fullName,
          role: formData.role,
          church_name: formData.churchName,
          church_address: formData.churchAddress,
          phone: formData.phone,
          bio: formData.bio || null,
          status: 'pending',
          verification_docs: uploadedFileUrls,
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 이메일 인증 메일 발송 + 관리자에게 신규 가입 알림 메일 발송 (베스트 에포트).
      // 실패하더라도 프로필 등록(가입) 자체는 이미 완료된 것이므로 다음 단계로 계속 진행합니다.
      // (관리자 대시보드의 "인증 메일 재발송" 버튼으로 언제든 다시 보낼 수 있습니다.)
      try {
        const { data: token, error: tokenError } = await supabase.rpc('create_email_verification_token', {
          p_user_id: userId
        });
        if (!tokenError && token) {
          const link = `${window.location.origin}/stay/verify-email?token=${token}`;
          await supabase.functions.invoke('send-email', {
            body: { type: 'email_verification', userId, link }
          });
        }
        await supabase.functions.invoke('send-email', {
          body: { type: 'admin_new_signup', userId }
        });
      } catch (emailErr) {
        console.error('알림 메일 발송 오류:', emailErr);
      }

      // 프로필 상태를 앱 전체에 반영하기 위해 새로고침하면서 완료 안내 페이지로 이동
      window.location.href = '/stay/signup-complete';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>확인 중...</p>
      </div>
    );
  }

  // (Phase 6) 후원자는 서류 심사 없이 성명만으로 즉시 가입이 완료되므로 완전히 다른(짧은)
  // 안내 문구와 입력폼을 보여줍니다.
  const isSupporter = formData.role === 'supporter';

  return (
    <>
      <PageHero
        images={COMPLETE_PROFILE_HERO_IMAGES}
        eyebrow="LAST STEP"
        title={isSupporter ? '거의 다 왔어요' : '프로필을 등록해주세요'}
        subtitle={isSupporter ? '성함만 알려주시면 바로 이용을 시작하실 수 있어요' : '마지막 단계입니다. 성명·연락처·소속 교회 정보를 입력해주세요'}
      />
      <div className="signup-container">
      <div className="container">
        <div className="signup-form">
          <h1>{isSupporter ? '후원자 정보 등록' : '프로필 등록'}</h1>
          <p className="subtitle">
            {isSupporter
              ? '서류 심사 없이 성함만 등록하시면 바로 후원자로 활동하실 수 있습니다.'
              : '마지막 단계입니다. 성명·연락처·소속 교회 및 증빙 자료를 등록해주세요.'}
          </p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {isSupporter ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>회원 유형</label>
                <div className="role-readonly">후원자 (서류 심사 없이 즉시 이용 가능)</div>
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
                <label>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="010-1234-5678 (선택)"
                  maxLength={13}
                />
              </div>

              <p className="help-text">
                후원자 계정은 관리자 승인 없이 바로 이용하실 수 있습니다. 등록 후 위위 소개 페이지로 안내해드립니다.
              </p>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '등록 중...' : '등록 완료하기'}
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>회원 유형</label>
              <div className="role-readonly">
                {formData.role === 'host' ? '숙소 제공자 (숙소 제공)' : '선교사 (숙소 예약)'}
              </div>
              <p className="help-text">
                가입하기에서 선택하신 회원 유형입니다. 변경이 필요하시면 처음부터 다시 가입해주세요.
              </p>
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
                maxLength={13}
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

            <div className="form-group">
              <label>자기소개</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                placeholder="다른 회원들에게 보여질 간단한 자기소개를 입력해주세요 (선택)"
              />
            </div>

            <div className="form-group">
              <label>검증 문서 (사진) *</label>
              <p className="help-text">
                {formData.role === 'host'
                  ? '신분증, 소속 교회 재직증명서, 숙소 소유·이용 권한을 확인할 수 있는 자료(등기부등본, 임대차계약서 등) 중 가능한 자료를 촬영하여 업로드해주세요.'
                  : '선교사증, 목사증, 교회 추천서 등을 촬영하여 업로드해주세요.'}
                {' '}(최소 1개, 최대 5개)
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

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '제출 중...' : '제출하고 승인 요청하기'}
            </button>
          </form>
          )}
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

        .role-readonly {
          padding: 0.85rem 1rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          background: #f8f9fa;
          color: #2c3e50;
          font-weight: 600;
        }

        .help-text {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-top: 0.5rem;
        }

        .file-upload {
          border: 2px dashed #d97b3f;
          border-radius: 6px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #fdf8f1;
        }

        .file-upload:hover {
          background: #faf1e6;
          border-color: #b8622c;
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
          color: #d97b3f;
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

        @media (max-width: 768px) {
          .signup-form {
            padding: 1.5rem;
          }

          .file-upload {
            padding: 1.5rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .signup-container {
            padding: 1rem 0;
          }

          .signup-form {
            padding: 1.25rem;
          }

          .signup-form .subtitle {
            font-size: 0.9rem;
          }

          .role-readonly {
            padding: 0.7rem 0.85rem;
            font-size: 0.9rem;
          }

          .help-text {
            font-size: 0.8rem;
          }

          .file-upload {
            padding: 1.25rem 0.75rem;
          }

          .file-label {
            font-size: 0.85rem;
          }

          .file-label span {
            font-size: 0.85rem;
          }

          .file-list h4 {
            font-size: 0.9rem;
          }

          .file-list li {
            padding: 0.6rem 0.75rem;
            font-size: 0.85rem;
            gap: 0.5rem;
          }

          .file-list li span {
            word-break: break-all;
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

export default CompleteProfile;
