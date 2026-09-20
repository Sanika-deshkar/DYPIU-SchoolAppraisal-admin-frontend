import React, { useState, useRef } from 'react';
import { createUniversity, updateUniversity, deleteUniversity, uploadAttachment } from '../api/adminApi';
import { UniversityLeadershipModal } from './UniversityLeadershipModal';
import { LogoCropModal } from './LogoCropModal';
import { getAttachmentUrl } from '../utils/attachment';

export const UniversityManager = ({
  universities = [],
  onReload,
  onSelectUniversity,
  selectedUniversity,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [leadershipTargetUni, setLeadershipTargetUni] = useState(null);
  const [deleteTargetUni, setDeleteTargetUni] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [cropConfig, setCropConfig] = useState({
    isOpen: false,
    field: null,
    imageSrc: null,
    title: '',
  });
  const [uploadingField, setUploadingField] = useState(null);
  const uniLogoInputRef = useRef(null);
  const iqacLogoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    domain: '',
    address: '',
    establishmentAct: '',
    primaryColor: '#2563eb',
    logoUrl: '',
    iqacLogoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectFile = (field, title, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropConfig({
      isOpen: true,
      field,
      imageSrc: objectUrl,
      title,
    });
    e.target.value = '';
  };

  const handleOpenCropForCurrent = (field, title) => {
    const currentSrc = formData[field];
    if (!currentSrc) return;
    setCropConfig({
      isOpen: true,
      field,
      imageSrc: getAttachmentUrl(currentSrc),
      title,
    });
  };

  const handleCropConfirm = async ({ dataUrl, file }) => {
    const field = cropConfig.field;
    if (!field) return;
    setCropConfig({ isOpen: false, field: null, imageSrc: null, title: '' });

    if (file) {
      setUploadingField(field);
      try {
        const uploadRes = await uploadAttachment(file);
        if (uploadRes?.url) {
          setFormData((prev) => ({ ...prev, [field]: uploadRes.url }));
          return;
        }
      } catch (err) {
        console.warn('Storage service upload not available, saving cropped image directly:', err);
      } finally {
        setUploadingField(null);
      }
    }
    // Fallback: save dataUrl directly
    setFormData((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const handleOpenCreate = () => {
    setEditingUniversity(null);
    setFormData({
      code: '',
      name: '',
      domain: '',
      address: '',
      establishmentAct: '',
      primaryColor: '#2563eb',
      logoUrl: '',
      iqacLogoUrl: '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUniversity(u);
    setFormData({
      code: u.code || '',
      name: u.name || '',
      domain: u.domain || '',
      address: u.address || '',
      establishmentAct: u.establishmentAct || '',
      primaryColor: u.primaryColor || '#2563eb',
      logoUrl: u.logoUrl || '',
      iqacLogoUrl: u.iqacLogoUrl || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingUniversity) {
        await updateUniversity(editingUniversity.id, formData);
      } else {
        await createUniversity(formData);
      }
      setShowModal(false);
      await onReload();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save university');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUni || deleteConfirmText.trim() !== deleteTargetUni.code) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUniversity(deleteTargetUni.id);
      if (selectedUniversity?.id === deleteTargetUni.id) {
        onSelectUniversity(null);
      }
      setDeleteTargetUni(null);
      setDeleteConfirmText('');
      await onReload();
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete university');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">🏛️ Universities & Tenants</h3>
          <p className="text-muted mb-0">
            Configure multi-tenant institutions, branding, and schema isolation.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold"
          onClick={handleOpenCreate}
        >
          + Onboard New University
        </button>
      </div>

      <div className="row g-4">
        {universities.map((u) => {
          const isSelected = selectedUniversity?.id === u.id;
          return (
            <div key={u.id} className="col-md-6 col-lg-4">
              <div
                className={`card h-100 shadow-sm border-2 ${
                  isSelected ? 'border-primary' : 'border-light'
                }`}
                style={{ borderRadius: '12px' }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-secondary text-uppercase fw-bold px-2 py-1">
                      {u.code}
                    </span>
                    <span className="badge bg-success">ACTIVE</span>
                  </div>

                  <h5 className="card-title fw-bold text-dark mb-1">{u.name}</h5>
                  <p className="text-muted small mb-2">{u.domain || 'No domain configured'}</p>

                  <div className="d-flex align-items-center justify-content-between mb-3 p-2 bg-light rounded border">
                    <div className="text-center" style={{ width: '48%' }}>
                      <small className="text-muted d-block fw-semibold" style={{ fontSize: '9px' }}>UNIVERSITY LOGO</small>
                      {u.logoUrl ? (
                        <img src={getAttachmentUrl(u.logoUrl)} alt="University Logo" style={{ height: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '11px' }}>Default Logo</span>
                      )}
                    </div>
                    <div className="border-start" style={{ height: '30px' }}></div>
                    <div className="text-center" style={{ width: '48%' }}>
                      <small className="text-muted d-block fw-semibold" style={{ fontSize: '9px' }}>IQAC LOGO</small>
                      {u.iqacLogoUrl ? (
                        <img src={getAttachmentUrl(u.iqacLogoUrl)} alt="IQAC Logo" style={{ height: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '11px' }}>Default Logo</span>
                      )}
                    </div>
                  </div>

                  <div className="small text-secondary mb-3 flex-grow-1">
                    <p className="mb-1 text-truncate">📍 {u.address || 'Address not specified'}</p>
                    {u.establishmentAct && (
                      <p className="mb-0 text-truncate fst-italic">📜 {u.establishmentAct}</p>
                    )}
                  </div>

                  <div className="d-flex gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${
                        isSelected ? 'btn-primary' : 'btn-outline-primary'
                      }`}
                      onClick={() => onSelectUniversity(u)}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => setLeadershipTargetUni(u)}
                      title="Configure IQAC & VC accounts"
                    >
                      👥 Leadership
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleOpenEdit(u)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteConfirmText('');
                        setDeleteTargetUni(u);
                      }}
                      title="Permanently delete this university"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '980px', width: '95vw' }}>
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {editingUniversity ? '✏️ Edit University' : '🏛️ Onboard New University'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="row g-4">
                    {/* Left Column: Basic Details */}
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">University Code (Unique identifier)*</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. apex_uni, mit_wpu"
                          disabled={Boolean(editingUniversity)}
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                        <small className="text-muted">Lowercase, alphanumeric without spaces.</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">University Full Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Apex Global University"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Domain</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. apex.edu.in"
                          value={formData.domain}
                          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">Campus Address</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Campus address..."
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>

                      <div className="mb-0">
                        <label className="form-label fw-semibold">Establishment Act / Authority</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Maharashtra Act No. XX of 2020"
                          value={formData.establishmentAct}
                          onChange={(e) => setFormData({ ...formData, establishmentAct: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Right Column: Logos */}
                    <div className="col-lg-6 d-flex flex-column gap-3">
                      {/* University Logo Field (Header Left) */}
                      <div className="p-3 bg-light rounded border flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold mb-0 text-dark">
                            🏛️ University / College Logo (Left Header Box)
                          </label>
                          {uploadingField === 'logoUrl' && (
                            <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                          )}
                        </div>

                        <input
                          ref={uniLogoInputRef}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handleSelectFile('logoUrl', 'Adjust University Logo (Left Box)', e)}
                        />

                        {formData.logoUrl ? (
                          <div className="d-flex align-items-center gap-3 p-2 bg-white rounded border">
                            <div
                              style={{
                                width: '90px',
                                height: '50px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f8fafc',
                                overflow: 'hidden',
                              }}
                            >
                              <img
                                src={getAttachmentUrl(formData.logoUrl)}
                                alt="University Logo Preview"
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                onClick={() => handleOpenCropForCurrent('logoUrl', 'Adjust University Logo (Left Box)')}
                              >
                                ✂️ Adjust / Crop
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm py-1 px-2"
                                onClick={() => uniLogoInputRef.current?.click()}
                              >
                                Upload New
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm py-1 px-2"
                                onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm w-100 py-2 border-dashed fw-semibold"
                              onClick={() => uniLogoInputRef.current?.click()}
                            >
                              📁 Select & Adjust University Logo
                            </button>
                          </div>
                        )}
                        <div className="mt-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Or paste direct logo URL (https://...)"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* IQAC Logo Field (Header Right) */}
                      <div className="p-3 bg-light rounded border flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold mb-0 text-dark">
                            ✨ IQAC Logo (Right Header Box)
                          </label>
                          {uploadingField === 'iqacLogoUrl' && (
                            <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                          )}
                        </div>

                        <input
                          ref={iqacLogoInputRef}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handleSelectFile('iqacLogoUrl', 'Adjust IQAC Logo (Right Box)', e)}
                        />

                        {formData.iqacLogoUrl ? (
                          <div className="d-flex align-items-center gap-3 p-2 bg-white rounded border">
                            <div
                              style={{
                                width: '90px',
                                height: '50px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f8fafc',
                                overflow: 'hidden',
                              }}
                            >
                              <img
                                src={getAttachmentUrl(formData.iqacLogoUrl)}
                                alt="IQAC Logo Preview"
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm py-1 px-2"
                                onClick={() => handleOpenCropForCurrent('iqacLogoUrl', 'Adjust IQAC Logo (Right Box)')}
                              >
                                ✂️ Adjust / Crop
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm py-1 px-2"
                                onClick={() => iqacLogoInputRef.current?.click()}
                              >
                                Upload New
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm py-1 px-2"
                                onClick={() => setFormData((prev) => ({ ...prev, iqacLogoUrl: '' }))}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm w-100 py-2 border-dashed fw-semibold"
                              onClick={() => iqacLogoInputRef.current?.click()}
                            >
                              📁 Select & Adjust IQAC Logo
                            </button>
                          </div>
                        )}
                        <div className="mt-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Or paste direct IQAC logo URL (https://...)"
                            value={formData.iqacLogoUrl}
                            onChange={(e) => setFormData({ ...formData, iqacLogoUrl: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? 'Saving...' : editingUniversity ? 'Update University' : 'Create & Initialize'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete University Confirmation Modal */}
      {deleteTargetUni && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '14px', overflow: 'hidden' }}>
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">⚠️ Delete University</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteTargetUni(null)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body p-4">
                {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}
                <p className="mb-2">
                  This will permanently delete <strong>{deleteTargetUni.name}</strong> ({deleteTargetUni.code}) and all of its
                  associated schemas, users, and submissions. <strong>This cannot be undone.</strong>
                </p>
                <label className="form-label fw-semibold small mt-3">
                  Type <code>{deleteTargetUni.code}</code> to confirm:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={deleteTargetUni.code}
                  autoFocus
                />
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteTargetUni(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  disabled={deleting || deleteConfirmText.trim() !== deleteTargetUni.code}
                  onClick={handleConfirmDelete}
                >
                  {deleting ? 'Deleting...' : 'Delete University'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leadership Accounts Modal */}
      <UniversityLeadershipModal
        university={leadershipTargetUni}
        isOpen={!!leadershipTargetUni}
        onClose={() => {
          setLeadershipTargetUni(null);
          onReload?.();
        }}
      />

      {/* Interactive Logo Crop Modal */}
      <LogoCropModal
        isOpen={cropConfig.isOpen}
        title={cropConfig.title}
        imageSrc={cropConfig.imageSrc}
        onConfirm={handleCropConfirm}
        onClose={() => setCropConfig({ isOpen: false, field: null, imageSrc: null, title: '' })}
      />
    </div>
  );
};
