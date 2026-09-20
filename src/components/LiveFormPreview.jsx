import React, { useState, useEffect } from 'react';
import { getVersionTree } from '../api/adminApi';
import { getAttachmentUrl } from '../utils/attachment';

export const LiveFormPreview = ({ versionId, onBack }) => {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [valuesData, setValuesData] = useState({});
  const [tablesData, setTablesData] = useState({});

  useEffect(() => {
    if (!versionId) return;
    const fetchTree = async () => {
      setLoading(true);
      try {
        const data = await getVersionTree(versionId);
        setSchema(data);
        if (data.sections && data.sections.length > 0) {
          setActiveSectionId(data.sections[0].sectionKey || data.sections[0].idString || data.sections[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, [versionId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading Live Form Preview...</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">No schema loaded for preview.</div>
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const { header, sections = [] } = schema;
  const currentSection =
    sections.find(
      (s) => (s.sectionKey || s.idString || s.id) === activeSectionId
    ) || sections[0];

  const handleCellChange = (tableKey, rowIndex, colName, val) => {
    const existing = tablesData[tableKey] || [];
    const updated = existing.map((r, i) => (i === rowIndex ? { ...r, [colName]: val } : r));
    setTablesData({ ...tablesData, [tableKey]: updated });
  };

  const handleAddRow = (tableKey, columns) => {
    const existing = tablesData[tableKey] || [];
    const newRow = {};
    columns.forEach((c) => (newRow[c] = ''));
    if (columns[0] && /^(sr\.?\s*no\.?|sn)$/i.test(columns[0])) {
      newRow[columns[0]] = String(existing.length + 1);
    }
    setTablesData({ ...tablesData, [tableKey]: [...existing, newRow] });
  };

  const handleDeleteRow = (tableKey, index, columns) => {
    const existing = tablesData[tableKey] || [];
    const updated = existing.filter((_, i) => i !== index);
    if (columns[0] && /^(sr\.?\s*no\.?|sn)$/i.test(columns[0])) {
      updated.forEach((r, idx) => {
        r[columns[0]] = String(idx + 1);
      });
    }
    setTablesData({ ...tablesData, [tableKey]: updated });
  };

  return (
    <div className="container py-4">
      {/* Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm border">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onBack}>
            ← Back to Editor
          </button>
          <div>
            <span className="badge bg-success me-2">Interactive Live Preview</span>
            <span className="fw-bold text-dark">{schema.title}</span>
          </div>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => {
              alert('Preview State Payload:\n\n' + JSON.stringify({ valuesData, tablesData }, null, 2));
            }}
          >
            🔍 Inspect JSON Payload
          </button>
        </div>
      </div>

      {/* University Header */}
      {header && (
        <div className="text-center mb-4 p-4 bg-white rounded shadow-sm border">
          {header.logoUrl && (
            <img
              src={getAttachmentUrl(header.logoUrl)}
              alt="Logo"
              style={{ maxHeight: '60px', marginBottom: '10px' }}
            />
          )}
          <h3 className="fw-bold text-primary mb-1">{header.university}</h3>
          {header.address && <p className="text-muted small mb-1">{header.address}</p>}
          {header.act && <p className="text-muted small mb-2 fst-italic">{header.act}</p>}
          <hr className="my-2" />
          <h4 className="fw-bold text-dark mt-2">{schema.title}</h4>
          {schema.academicYear && (
            <span className="badge bg-secondary px-3 py-2 fs-6">
              Academic Year: {schema.academicYear}
            </span>
          )}
        </div>
      )}

      {/* Section Navigation Tabs */}
      {sections.length > 1 && (
        <ul className="nav nav-pills nav-fill mb-4 bg-white p-2 rounded shadow-sm border">
          {sections.map((sec) => {
            const sKey = sec.sectionKey || sec.idString || sec.id;
            const isActive = sKey === activeSectionId;
            return (
              <li key={sec.id || sKey} className="nav-item">
                <button
                  type="button"
                  className={`nav-link fw-semibold text-start text-truncate ${
                    isActive ? 'active bg-primary text-white' : 'text-secondary'
                  }`}
                  onClick={() => setActiveSectionId(sKey)}
                  style={{ borderRadius: '6px', margin: '2px' }}
                >
                  {sec.number ? `Sec ${sec.number}: ` : ''}
                  {sec.title}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Current Section Fields & Tables */}
      {currentSection && (
        <div className="section-content mb-5">
          <div className="bg-primary text-white p-3 rounded mb-4 shadow-sm">
            <h4 className="mb-0 fw-bold">
              {currentSection.number ? `Section ${currentSection.number}: ` : ''}
              {currentSection.title}
            </h4>
            {currentSection.description && (
              <p className="mb-0 mt-1 small opacity-75">{currentSection.description}</p>
            )}
          </div>

          {/* Section Header Fields */}
          {currentSection.fields && currentSection.fields.length > 0 && (
            <div className="card mb-4 shadow-sm border-0">
              <div className="card-body">
                <div className="row g-3">
                  {currentSection.fields.map((f) => {
                    const key = f.fieldKey || f.idString;
                    return (
                      <div key={f.id} className="col-md-6">
                        <label className="form-label fw-semibold">
                          {f.label} {f.isRequired && <span className="text-danger">*</span>}
                        </label>
                        {f.fieldType === 'TEXTAREA' ? (
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder={f.placeholder}
                            value={valuesData[key] || ''}
                            onChange={(e) => setValuesData({ ...valuesData, [key]: e.target.value })}
                          />
                        ) : f.fieldType === 'SELECT' ? (
                          <select
                            className="form-select"
                            value={valuesData[key] || ''}
                            onChange={(e) => setValuesData({ ...valuesData, [key]: e.target.value })}
                          >
                            <option value="">-- Select --</option>
                            {f.options &&
                              f.options.map((opt, i) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            type={f.fieldType === 'NUMBER' ? 'number' : f.fieldType === 'DATE' ? 'date' : 'text'}
                            className="form-control"
                            placeholder={f.placeholder}
                            value={valuesData[key] || ''}
                            onChange={(e) => setValuesData({ ...valuesData, [key]: e.target.value })}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Section Tables */}
          {currentSection.tables &&
            currentSection.tables.map((tbl) => {
              const tKey = tbl.tableKey || tbl.idString;
              const rows = tablesData[tKey] || [];
              const columns = tbl.columns && tbl.columns.length > 0
                ? tbl.columns
                : tbl.fields?.map((f) => f.label || f.fieldKey) || [];

              return (
                <div key={tbl.id} className="card mb-4 shadow-sm border-0">
                  {tbl.showTitle && tbl.title && (
                    <div className="card-header bg-light py-2">
                      <h6 className="mb-0 fw-bold text-secondary">{tbl.title}</h6>
                    </div>
                  )}
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover mb-0 align-middle">
                        <thead className="table-light text-center">
                          <tr>
                            {columns.map((col, idx) => (
                              <th key={idx} className="small fw-semibold">
                                {col}
                              </th>
                            ))}
                            {tbl.isRepeatable && <th style={{ width: '60px' }}>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={columns.length + (tbl.isRepeatable ? 1 : 0)}
                                className="text-center text-muted py-3"
                              >
                                No records added yet. Click "+ Add Row" below.
                              </td>
                            </tr>
                          ) : (
                            rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {columns.map((col, cIdx) => (
                                  <td key={cIdx}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={row[col] || ''}
                                      onChange={(e) => handleCellChange(tKey, rIdx, col, e.target.value)}
                                    />
                                  </td>
                                ))}
                                {tbl.isRepeatable && (
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteRow(tKey, rIdx, columns)}
                                    >
                                      ✕
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {tbl.isRepeatable && (
                    <div className="card-footer bg-white border-top-0 d-flex justify-content-end py-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleAddRow(tKey, columns)}
                      >
                        + Add Row
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
