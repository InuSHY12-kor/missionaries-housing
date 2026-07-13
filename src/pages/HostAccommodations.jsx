import React, { useState, useEffect } from 'react';
import { supabase } from '../App';
import { Trash2, Edit, Plus } from 'lucide-react';

function HostAccommodations({ userProfile }) {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    capacity: '',
    bedrooms: '',
    bathrooms: '',
    amenities: ''
  });

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('host_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccommodations(data || []);
    } catch (error) {
      console.error('숙소 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const amenitiesArray = formData.amenities
        .split(',')
        .map(a => a.trim())
        .filter(a => a);

      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('accommodations')
          .update({
            title: formData.title,
            description: formData.description,
            location: formData.location,
            price: parseFloat(formData.price),
            capacity: parseInt(formData.capacity),
            bedrooms: parseInt(formData.bedrooms),
            bathrooms: parseInt(formData.bathrooms),
            amenities: amenitiesArray,
            status: 'pending'
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // 신규 등록
        const { error } = await supabase
          .from('accommodations')
          .insert({
            host_id: userProfile.id,
            title: formData.title,
            description: formData.description,
            location: formData.location,
            price: parseFloat(formData.price),
            capacity: parseInt(formData.capacity),
            bedrooms: parseInt(formData.bedrooms),
            bathrooms: parseInt(formData.bathrooms),
            amenities: amenitiesArray,
            status: 'pending'
          });

        if (error) throw error;
      }

      alert(editingId ? '숙소가 수정되었습니다!' : '숙소가 등록되었습니다! 관리자 승인 후 공개됩니다.');
      setFormData({
        title: '',
        description: '',
        location: '',
        price: '',
        capacity: '',
        bedrooms: '',
        bathrooms: '',
        amenities: ''
      });
      setShowForm(false);
      setEditingId(null);
      fetchAccommodations();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const handleEdit = (accommodation) => {
    setFormData({
      title: accommodation.title,
      description: accommodation.description,
      location: accommodation.location,
      price: accommodation.price.toString(),
      capacity: accommodation.capacity.toString(),
      bedrooms: accommodation.bedrooms?.toString() || '',
      bathrooms: accommodation.bathrooms?.toString() || '',
      amenities: accommodation.amenities?.join(', ') || ''
    });
    setEditingId(accommodation.id);
    setShowForm(true);
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
      case 'pending': return '검토 중';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  return (
    <div className="host-accommodations">
      <div className="container">
        <div className="header">
          <h1>내 숙소 관리</h1>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                title: '',
                description: '',
                location: '',
                price: '',
                capacity: '',
                bedrooms: '',
                bathrooms: '',
                amenities: ''
              });
            }}
          >
            <Plus size={18} />
            새 숙소 등록
          </button>
        </div>

        {/* 등록 폼 */}
        {showForm && (
          <div className="form-section">
            <h2>{editingId ? '숙소 수정' : '새 숙소 등록'}</h2>
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
                    required
                  />
                </div>
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
                <label>편의시설 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  placeholder="WiFi, 에어컨, 주방, 세탁기"
                />
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
                </div>

                {accommodation.rejection_reason && (
                  <div className="rejection-notice">
                    <strong>거절 사유:</strong> {accommodation.rejection_reason}
                  </div>
                )}

                <div className="item-actions">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
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

        .item-actions {
          display: flex;
          gap: 0.75rem;
        }

        .item-actions button {
          flex: 1;
          max-width: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
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

          .item-actions button {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HostAccommodations;
