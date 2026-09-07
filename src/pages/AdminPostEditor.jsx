import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { AlertCircle, Upload, X, ArrowLeft, ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';

const EDITOR_HERO_IMAGES = [
  'https://images.pexels.com/photos/261510/pexels-photo-261510.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  imageUrls: [],
  status: 'draft'
};

// 한글 제목만으로는 예쁜 영문 슬러그를 만들 수 없어서(한글은 전부 제거됨), 영문/숫자만
// 남기고 나머지는 버립니다. 결과가 비어 있으면(순수 한글 제목 등) 호출한 쪽에서
// 타임스탬프 기반 슬러그로 대체합니다.
function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fallbackSlug() {
  return `post-${Date.now()}`;
}

function AdminPostEditor({ userProfile }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;

    const loadPost = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('ministry_posts')
          .select('*')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;

        // image_urls가 없던(옛날) 글은 cover_image_url 하나만 있을 수 있어 그것을
        // 첫 장으로 대체합니다 — 기존 데이터도 새 다중 이미지 UI에서 그대로 보이도록.
        const existingImages = Array.isArray(data.image_urls) && data.image_urls.length > 0
          ? data.image_urls
          : (data.cover_image_url ? [data.cover_image_url] : []);

        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          imageUrls: existingImages,
          status: data.status || 'draft'
        });
        // 이미 슬러그가 있는(기존) 글이므로 제목이 바뀌어도 슬러그를 자동으로 덮어쓰지 않도록 함
        setSlugTouched(true);
      } catch (err) {
        setError('글을 불러오지 못했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, isEditing]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title)
    }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  };

  // 인스타그램 카드뉴스 형태로 여러 장을 한 번에 업로드합니다. 선택한 파일들을 순서대로
  // 업로드해서 formData.imageUrls 배열 뒤에 이어 붙입니다(이미 올린 사진은 그대로 두고
  // 추가만 되도록). 첫 번째로 올라간 사진이 목록/공유 미리보기의 대표 이미지가 됩니다.
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${userProfile.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('ministry-post-images')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ministry-post-images')
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploadedUrls] }));
    } catch (err) {
      alert('이미지 업로드 오류: ' + err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = async (index) => {
    const url = formData.imageUrls[index];
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));

    try {
      const marker = '/ministry-post-images/';
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = url.slice(idx + marker.length);
        await supabase.storage.from('ministry-post-images').remove([storagePath]);
      }
    } catch {
      // 스토리지 삭제 실패는 조용히 무시(폼에서는 이미 제거됨)
    }
  };

  const moveImage = (index, direction) => {
    setFormData((prev) => {
      const next = [...prev.imageUrls];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, imageUrls: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!formData.content.trim()) {
      setError('본문을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug.trim() || fallbackSlug();
      const payload = {
        title: formData.title.trim(),
        slug,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content,
        image_urls: formData.imageUrls,
        // cover_image_url은 목록 카드/공유 미리보기 등 기존 코드와의 하위 호환을 위해
        // 첫 번째 사진으로 계속 채워둡니다.
        cover_image_url: formData.imageUrls[0] || null,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        // 임시저장 상태였던 글을 이번에 처음 발행 상태로 바꾸는 경우에만 발행일을 새로 찍음
        if (formData.status === 'published') {
          const { data: existing } = await supabase
            .from('ministry_posts')
            .select('published_at')
            .eq('id', id)
            .single();
          if (!existing?.published_at) {
            payload.published_at = new Date().toISOString();
          }
        }

        const { error: updateError } = await supabase
          .from('ministry_posts')
          .update(payload)
          .eq('id', id);
        if (updateError) throw updateError;
      } else {
        if (formData.status === 'published') {
          payload.published_at = new Date().toISOString();
        }
        const { error: insertError } = await supabase
          .from('ministry_posts')
          .insert({ ...payload, author_id: userProfile.id });
        if (insertError) throw insertError;
      }

      navigate('/admin?tab=posts');
    } catch (err) {
      if (err.code === '23505') {
        setError('이미 사용 중인 슬러그입니다. 다른 슬러그를 입력해주세요.');
      } else {
        setError('저장 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p>로드 중...</p>
      </div>
    );
  }

  return (
    <>
      <PageHero
        images={EDITOR_HERO_IMAGES}
        eyebrow="ADMIN"
        title={isEditing ? '사역 소식 글 수정' : '사역 소식 새 글 작성'}
        subtitle="발행하면 WEWE 홈페이지의 사역 소식 페이지에 바로 공개됩니다"
      />
      <div className="admin-post-editor-container">
        <div className="container">
          <div className="admin-post-editor">
            <h1>{isEditing ? '글 수정' : '새 글 작성'}</h1>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="예: 2026년 겨울 목회자 아카데미를 마치고"
                  required
                />
              </div>

              <div className="form-group">
                <label>슬러그(공개 주소) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="예: winter-2026-pastor-academy"
                  required
                />
                <p className="field-hint">
                  공개 주소: wewestay.com/news/{formData.slug || '(슬러그를-입력하세요)'}
                </p>
              </div>

              <div className="form-group">
                <label>요약(목록에 짧게 표시됩니다)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="목록 페이지의 카드에 보여줄 한두 문장 요약"
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>사진 (여러 장 선택 가능)</label>
                <p className="field-hint field-hint-top">
                  인스타그램 카드뉴스처럼 목록에 여러 장이 함께 노출됩니다. 첫 번째 사진이 대표 이미지가 됩니다.
                </p>

                {formData.imageUrls.length > 0 && (
                  <div className="post-image-grid">
                    {formData.imageUrls.map((url, index) => (
                      <div className="post-image-item" key={url}>
                        <img src={url} alt={`사진 ${index + 1}`} />
                        {index === 0 && <span className="post-image-cover-tag">대표</span>}
                        <div className="post-image-item-actions">
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            title="앞으로 이동"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === formData.imageUrls.length - 1}
                            title="뒤로 이동"
                          >
                            <ArrowRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="post-image-remove"
                            onClick={() => removeImage(index)}
                            title="삭제"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="post-cover-image-input"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <label htmlFor="post-cover-image-input" className="image-upload-label">
                    <Upload size={24} />
                    <span>
                      {uploadingImage
                        ? '업로드 중...'
                        : formData.imageUrls.length > 0
                          ? '사진 추가하기'
                          : '사진을 선택하세요 (여러 장 가능)'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>본문 *</label>
                <textarea
                  className="post-content-textarea"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="본문을 입력하세요. 빈 줄로 문단을 나눌 수 있습니다."
                  rows={16}
                  required
                />
              </div>

              <div className="form-group">
                <label>발행 상태</label>
                <div className="status-radio-group">
                  <label className="status-radio">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                    />
                    <span>임시저장 (공개되지 않음)</span>
                  </label>
                  <label className="status-radio">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                    />
                    <span>발행 (지금 바로 공개)</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <Link to="/admin?tab=posts" className="btn btn-secondary">취소</Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '저장 중...' : isEditing ? '수정 저장' : '저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .admin-post-editor-container {
          flex: 1;
          padding: 2rem 0;
        }

        .admin-post-editor {
          background: white;
          padding: 2.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 720px;
          margin: 0 auto;
        }

        .admin-post-editor h1 {
          margin-bottom: 1.5rem;
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

        .image-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #d97b3f;
        }

        .field-hint {
          margin-top: 0.4rem;
          margin-bottom: 0;
          font-size: 0.82rem;
          color: #888;
          word-break: break-all;
        }

        .post-content-textarea {
          font-family: inherit;
          line-height: 1.7;
          resize: vertical;
        }

        .status-radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .status-radio {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-weight: 400;
        }

        .status-radio input {
          width: auto;
          margin: 0;
          cursor: pointer;
        }

        .field-hint-top {
          margin-top: -0.2rem;
          margin-bottom: 0.75rem;
        }

        .post-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.9rem;
        }

        .post-image-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          background: #f2f0eb;
        }

        .post-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .post-image-cover-tag {
          position: absolute;
          top: 6px;
          left: 6px;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
          background: rgba(217, 123, 63, 0.92);
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .post-image-item-actions {
          position: absolute;
          inset: auto 0 0 0;
          display: flex;
          justify-content: center;
          gap: 0.3rem;
          padding: 0.35rem;
          background: linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%);
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .post-image-item:hover .post-image-item-actions {
          opacity: 1;
        }

        .post-image-item-actions button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.92);
          color: #1c1c1a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .post-image-item-actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .post-image-item-actions button.post-image-remove {
          background: rgba(220, 60, 50, 0.92);
          color: #fff;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
          .admin-post-editor {
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

export default AdminPostEditor;
