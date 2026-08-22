import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../App';
import { Trash2, Edit, Plus, Eye, Upload, X, CalendarClock } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import Calendar from '../components/Calendar';
import AmenityIcon from '../components/AmenityIcon';
import { AMENITY_GROUPS } from '../utils/amenities';

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  price: '',
  capacity: '',
  bedrooms: '',
  bathrooms: '',
  amenities: [],
  amenitiesOther: [],
  images: [],
  latitude: null,
  longitude: null
};

// 숙소별 "날짜 관리" 패널: 예약된 날짜는 회색으로 비활성화 표시하고,
// 호스트가 원하는 날짜를 클릭하면 직접 차단/해제할 수 있습니다.
function AvailabilityManager({ accommodationId }) {
  const [bookedDates, setBookedDates] = useState(new Set());
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ranges, error: rangesError }, { data: blocked, error: blockedError }] = await Promise.all([
        supabase.rpc('get_accommodation_booked_ranges', { p_accommodation_id: accommodationId }),
        supabase.rpc('get_accommodation_blocked_dates', { p_accommodation_id: accommodationId })
      ]);

      if (rangesError) throw rangesError;
      if (blockedError) throw blockedError;

      const bookedSet = new Set();
      (ranges || []).forEach(r => {
        const cursor = new Date(r.check_in);
        const end = new Date(r.check_out);
        while (cursor < end) {
          bookedSet.add(cursor.toISOString().split('T')[0]);
          cursor.setDate(cursor.getDate() + 1);
        }
      });

      setBookedDates(bookedSet);
      setBlockedDates(new Set((blocked || []).map(b => b.blocked_date)));
    } catch (error) {
      console.error('날짜 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [accommodationId]);

  useEffect(() => {
    load();
  }, [load]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isDisabled = (dateStr) => dateStr < todayStr || bookedDates.has(dateStr);
  const isSelected = (dateStr) => blockedDates.has(dateStr);

  const handleDayClick = async (dateStr) => {
    if (busy) return;
    setBusy(true);
    try {
      if (blockedDates.has(dateStr)) {
        const { error } = await supabase
          .from('accommodation_blocked_dates')
          .delete()
          .eq('accommodation_id', accommodationId)
          .eq('blocked_date', dateStr);
        if (error) throw error;
        setBlockedDates(prev => {
          const next = new Set(prev);
          next.delete(dateStr);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('accommodation_blocked_dates')
          .insert({ accommodation_id: accommodationId, blocked_date: dateStr });
        if (error) throw error;
        setBlockedDates(prev => new Set(prev).add(dateStr));
      }
    } catch (error) {
      alert('날짜 설정 오류: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="availability-loading">날짜 정보를 불러오는 중...</p>;

  return (
    <div className="availability-manager">
      <p className="availability-hint">
        회색으로 표시된 날짜는 이미 예약이 있어 선택할 수 없습니다. 예약을 받지 않으실 날짜를 클릭하면 차단되며(파란색), 다시 클릭하면 해제됩니다.
      </p>
      <Calendar isDisabled={isDisabled} isSelected={isSelected} onDayClick={handleDayClick} />
    </div>
  );
}

function HostAccommodations({ userProfile }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dateManagerId, setDateManagerId] = useState(null);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  const isAdmin = userProfile.role === 'admin';

  // 관리자는 문제 발생 시 조정할 수 있도록 모든 호스트의 숙소를 볼 수 있고,
  // 일반 호스트는 기존처럼 본인 숙소만 봅니다.
  const fetchAccommodations = useCallback(async () => {
    try {
      let query = supabase
        .from('accommodations')
        .select(isAdmin ? '*, users(full_name, email)' : '*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('host_id', userProfile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAccommodations(data || []);
    } catch (error) {
      console.error('숙소 로드 오류:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.id, isAdmin]);

  useEffect(() => {
    fetchAccommodations();
  }, [fetchAccommodations]);

  const handleEdit = useCallback((accommodation) => {
    setFormData({
      title: accommodation.title,
      description: accommodation.description,
      location: accommodation.location,
      price: accommodation.price.toString(),
      capacity: accommodation.capacity.toString(),
      bedrooms: accommodation.bedrooms?.toString() || '',
      bathrooms: accommodation.bathrooms?.toString() || '',
      amenities: accommodation.amenities || [],
      amenitiesOther: accommodation.amenities_other || [],
      images: accommodation.images || [],
      latitude: accommodation.latitude ?? null,
      longitude: accommodation.longitude ?? null
    });
    setEditingId(accommodation.id);
    setShowForm(true);
  }, []);

  // 숙소 상세 페이지의 "수정하기" 버튼에서 ?edit=ID 로 들어온 경우 자동으로 수정 폼을 엽니다.
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam && accommodations.length > 0) {
      const target = accommodations.find(a => a.id === editParam);
      if (target) {
        handleEdit(target);
        setSearchParams({}, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, accommodations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (coords) => {
    setFormData(prev => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng
    }));
  };

  const toggleAmenity = (key) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(key)
        ? prev.amenities.filter(k => k !== key)
        : [...prev.amenities, key]
    }));
  };

  // 사전 정의 목록에 없는 편의시설을 호스트가 직접 텍스트로 추가
  const addCustomAmenity = () => {
    const value = customAmenityInput.trim();
    if (!value) return;
    if (formData.amenitiesOther.includes(value)) {
      setCustomAmenityInput('');
      return;
    }
    setFormData(prev => ({ ...prev, amenitiesOther: [...prev.amenitiesOther, value] }));
    setCustomAmenityInput('');
  };

  const removeCustomAmenity = (value) => {
    setFormData(prev => ({ ...prev, amenitiesOther: prev.amenitiesOther.filter(v => v !== value) }));
  };

  const MAX_IMAGES = 20;
  const RECOMMENDED_MIN_IMAGES = 10;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > MAX_IMAGES) {
      alert(`사진은 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`);
      e.target.value = '';
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${userProfile.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('accommodation-images')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('accommodation-images')
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      alert('이미지 업로드 오류: ' + error.message);
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const removeImage = (url) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter(u => u !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length < RECOMMENDED_MIN_IMAGES) {
      const proceed = window.confirm(
        `사진이 ${formData.images.length}장 등록되어 있습니다. 원활한 검토를 위해 최소 ${RECOMMENDED_MIN_IMAGES}장 이상(건물 외부/입구, 화장실, 현관, 방마다 사진 포함)을 권장드립니다.\n\n그래도 지금 상태로 등록하시겠습니까?`
      );
      if (!proceed) return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity, 10),
        bedrooms: parseInt(formData.bedrooms, 10) || null,
        bathrooms: parseInt(formData.bathrooms, 10) || null,
        amenities: formData.amenities,
        amenities_other: formData.amenitiesOther,
        images: formData.images,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      if (editingId) {
        // 수정 후 재제출하면 관리자가 이전에 남긴 수정 요청/거절 사유는 지우고 새로 검토를 받습니다.
        const { error } = await supabase
          .from('accommodations')
          .update({ ...payload, status: 'pending', rejection_reason: null, admin_feedback_type: null })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accommodations')
          .insert({ ...payload, host_id: userProfile.id, status: 'pending' });

        if (error) throw error;
      }

      alert(editingId ? '숙소가 수정되었습니다!' : '숙소가 등록되었습니다! 관리자 승인 후 공개됩니다.');
      setFormData(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
      fetchAccommodations();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('accommodations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAccommodations();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '관리자 승인 대기중';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  return (
    <div className="host-accommodations">
      <div className="container">
        <div className="header">
          <div>
            <h1>{isAdmin ? '전체 숙소 관리 (관리자)' : '내 숙소 관리'}</h1>
            {isAdmin && (
              <p className="admin-scope-hint">
                관리자 권한으로 모든 호스트의 숙소를 확인/수정/삭제할 수 있습니다.
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData(EMPTY_FORM);
            }}
          >
            <Plus size={18} />
            새 숙소 등록
          </button>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && (
          <div className="form-section">
            <h2>{editingId ? '숙소 수정' : '새 숙소 등록'}</h2>

            <div className="host-guideline-box">
              <h4>등록 전에 꼭 확인해주세요</h4>
              <ul>
                <li>숙소는 다른 이용자와 완전히 분리된 <strong>독립된 공간</strong>이어야 합니다.</li>
                <li>1박 가격은 영리 목적의 숙박료가 아니라, <strong>최소한의 관리비·청소비 수준</strong>으로만 책정해 주세요.</li>
                <li>사진은 <strong>최소 10장 이상</strong> 등록해 주세요. 건물 외부(입구 포함), 화장실, 현관, 그리고 방이 여러 개라면 방마다 사진을 꼭 포함해 주세요.</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>숙소명 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>지역 *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="예: 서울시 강남구 역삼동"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>지도 위치</label>
                <LocationPicker
                  address={formData.location}
                  lat={formData.latitude}
                  lng={formData.longitude}
                  onChange={handleLocationChange}
                />
              </div>

              <div className="form-group">
                <label>설명 *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="5"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>1박 가격 (₩) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="help-text">시세가 아닌, 관리비·청소비 등 최소한의 실비 수준으로 입력해 주세요.</p>
                </div>
                <div className="form-group">
                  <label>수용인원 *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>침실 수</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>욕실 수</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>숙소 사진</label>
                <p className="help-text">
                  최소 10장 이상, 최대 {MAX_IMAGES}장까지 등록해 주세요. 건물 외부(입구 포함), 화장실, 현관, 방이 여러 개인 경우 방마다 사진을 꼭 포함해 주세요.
                  여러 장 등록하시면 숙소 상세 페이지에서 슬라이드로 보여집니다.
                </p>

                {formData.images.length > 0 && (
                  <div className="image-manager-grid">
                    {formData.images.map((url) => (
                      <div key={url} className="image-manager-item">
                        <img src={url} alt="숙소 사진" />
                        <button type="button" className="image-remove-btn" onClick={() => removeImage(url)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="image-upload">
                  <input
                    type="file"
                    id="accommodation-image-input"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || formData.images.length >= MAX_IMAGES}
                  />
                  <label htmlFor="accommodation-image-input" className="image-upload-label">
                    <Upload size={22} />
                    <span>{uploadingImages ? '업로드 중...' : '사진을 선택하거나 드래그하세요'}</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>편의시설</label>
                <p className="help-text">체크한 편의시설만 숙소 상세 페이지에 노출됩니다.</p>
                <div className="amenities-picker">
                  {AMENITY_GROUPS.map(group => (
                    <div key={group.group} className="amenities-picker-group">
                      <h4>{group.group}</h4>
                      <div className="amenities-picker-items">
                        {group.items.map(item => (
                          <label
                            key={item.key}
                            className={`amenity-checkbox ${formData.amenities.includes(item.key) ? 'active' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.amenities.includes(item.key)}
                              onChange={() => toggleAmenity(item.key)}
                            />
                            <AmenityIcon name={item.icon} size={16} />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="custom-amenity-input">
                  <label>목록에 없는 편의시설 직접 추가</label>
                  <div className="custom-amenity-row">
                    <input
                      type="text"
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomAmenity();
                        }
                      }}
                      placeholder="예: 정원 바비큐 시설"
                    />
                    <button type="button" className="btn btn-secondary" onClick={addCustomAmenity}>
                      추가
                    </button>
                  </div>

                  {formData.amenitiesOther.length > 0 && (
                    <div className="custom-amenity-chips">
                      {formData.amenitiesOther.map((value) => (
                        <span key={value} className="custom-amenity-chip">
                          {value}
                          <button type="button" onClick={() => removeCustomAmenity(value)}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingId ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 숙소 목록 */}
        {loading ? (
          <p>로드 중...</p>
        ) : accommodations.length === 0 ? (
          <p className="empty-message">등록된 숙소가 없습니다.</p>
        ) : (
          <div className="accommodations-list">
            {accommodations.map(accommodation => (
              <div key={accommodation.id} className="accommodation-item">
                <div className="item-header">
                  <div>
                    <h3>{accommodation.title}</h3>
                    <p>{accommodation.location}</p>
                    {isAdmin && accommodation.users && (
                      <p className="admin-host-hint">호스트: {accommodation.users.full_name} ({accommodation.users.email})</p>
                    )}
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: getStatusColor(accommodation.status) }}
                  >
                    {getStatusText(accommodation.status)}
                  </span>
                </div>

                <div className="item-details">
                  <p><strong>설명:</strong> {accommodation.description.substring(0, 100)}...</p>
                  <p><strong>가격:</strong> ₩{accommodation.price.toLocaleString()}/일</p>
                  <p><strong>수용인원:</strong> {accommodation.capacity}명</p>
                  <p><strong>침실:</strong> {accommodation.bedrooms}, <strong>욕실:</strong> {accommodation.bathrooms}</p>
                  <p><strong>사진:</strong> {accommodation.images?.length || 0}장</p>
                  <p>
                    <strong>지도 위치:</strong>{' '}
                    {accommodation.latitude != null && accommodation.longitude != null
                      ? '등록됨'
                      : '미등록 (수정에서 추가해주세요)'}
                  </p>
                </div>

                {accommodation.rejection_reason && (
                  <div className={`rejection-notice ${accommodation.admin_feedback_type === 'revision' ? 'revision-notice' : ''}`}>
                    <strong>{accommodation.admin_feedback_type === 'revision' ? '관리자 수정 요청' : '관리자 거절 사유'}:</strong>{' '}
                    {accommodation.rejection_reason}
                    <p className="rejection-notice-hint">
                      아래 "수정" 버튼으로 내용을 반영해 다시 제출하시면 검토가 재진행됩니다. 승인 전까지는 계속 승인 대기중 상태로 유지됩니다.
                    </p>
                  </div>
                )}

                <div className="item-actions">
                  <Link to={`/accommodations/${accommodation.id}`} className="btn btn-secondary">
                    <Eye size={16} />
                    보기
                  </Link>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setDateManagerId(dateManagerId === accommodation.id ? null : accommodation.id)}
                  >
                    <CalendarClock size={16} />
                    날짜 관리
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleEdit(accommodation)}
                  >
                    <Edit size={16} />
                    수정
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(accommodation.id)}
                  >
                    <Trash2 size={16} />
                    삭제
                  </button>
                </div>

                {dateManagerId === accommodation.id && (
                  <AvailabilityManager accommodationId={accommodation.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .host-guideline-box {
          background: #fff8e6;
          border: 1px solid #f0dcb0;
          border-radius: 8px;
          padding: 1.25rem 1.5rem;
          margin: 1rem 0 1.5rem;
        }

        .host-guideline-box h4 {
          color: #8a5a12;
          margin-bottom: 0.6rem;
        }

        .host-guideline-box ul {
          margin: 0;
          padding-left: 1.1rem;
          color: #6b4a15;
          line-height: 1.7;
        }

        .host-guideline-box li {
          margin-bottom: 0.35rem;
        }

        .custom-amenity-input {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px dashed #dfe6e9;
        }

        .custom-amenity-input label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .custom-amenity-row {
          display: flex;
          gap: 0.6rem;
        }

        .custom-amenity-row input {
          flex: 1;
          padding: 0.6rem 0.75rem;
          border: 1px solid #dfe6e9;
          border-radius: 6px;
          font-family: inherit;
        }

        .custom-amenity-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.85rem;
        }

        .custom-amenity-chip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.7rem;
          background: white;
          border: 1px solid #16808E;
          color: #16808E;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .custom-amenity-chip button {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          color: #16808E;
          cursor: pointer;
          padding: 0;
        }

        .host-accommodations {
          flex: 1;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .admin-scope-hint {
          color: #7f8c8d;
          font-size: 0.85rem;
          margin-top: 0.35rem;
        }

        .admin-host-hint {
          color: #16808E;
          font-size: 0.82rem;
          margin-top: 0.25rem;
        }

        .form-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .help-text {
          font-size: 0.85rem;
          color: #7f8c8d;
          margin: -0.25rem 0 0.75rem;
        }

        .image-manager-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .image-manager-item {
          position: relative;
          border-radius: 6px;
          overflow: hidden;
          aspect-ratio: 1;
        }

        .image-manager-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-remove-btn {
          position: absolute;
          top: 0.35rem;
          right: 0.35rem;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: rgba(231, 76, 60, 0.9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .image-upload {
          border: 2px dashed #16808E;
          border-radius: 6px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f0f9fa;
        }

        .image-upload:hover {
          background: #e6f4f5;
          border-color: #106570;
        }

        .image-upload input {
          display: none;
        }

        .image-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          color: #16808E;
        }

        .amenities-picker {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.25rem;
        }

        .amenities-picker-group h4 {
          color: #2c3e50;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .amenities-picker-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .amenity-checkbox {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #dfe6e9;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #555;
          transition: all 0.2s;
        }

        .amenity-checkbox input {
          display: none;
        }

        .amenity-checkbox svg {
          color: #16808E;
        }

        .amenity-checkbox.active {
          background: #16808E;
          border-color: #16808E;
          color: white;
        }

        .amenity-checkbox.active svg {
          color: white;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .form-actions button {
          flex: 1;
          max-width: 200px;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .accommodations-list {
          display: grid;
          gap: 1.5rem;
        }

        .accommodation-item {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ecf0f1;
        }

        .item-header h3 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .item-header p {
          color: #7f8c8d;
          margin: 0;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .item-details {
          margin-bottom: 1rem;
        }

        .item-details p {
          margin: 0.5rem 0;
          color: #555;
        }

        .rejection-notice {
          background: #fadbd8;
          border-left: 4px solid #e74c3c;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
          color: #2c3e50;
        }

        .rejection-notice.revision-notice {
          background: #fff8e6;
          border-left-color: #f39c12;
        }

        .rejection-notice-hint {
          margin: 0.6rem 0 0;
          font-size: 0.82rem;
          color: #7f8c8d;
        }

        .item-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .item-actions .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .availability-manager {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #ecf0f1;
        }

        .availability-hint {
          font-size: 0.85rem;
          color: #7f8c8d;
          margin-bottom: 0.75rem;
        }

        .availability-loading {
          margin-top: 1.5rem;
          color: #7f8c8d;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header button {
            width: 100%;
            justify-content: center;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .item-actions {
            flex-direction: column;
          }

          .item-actions .btn {
            max-width: none;
          }

          .custom-amenity-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default HostAccommodations;
