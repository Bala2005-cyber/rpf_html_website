import React, { useState } from 'react';
import './uploadrfp.css'; // Make sure to create and link this CSS file
import { useLanguage } from './LanguageContext';
import { translations } from './translations';
import localStorageService from './localStorageService';

const UploadRFP = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [productSummary, setProductSummary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [status, setStatus] = useState("open");
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    console.log("File input changed. Files:", files);
    if (files && files.length > 0) {
      console.log("Setting file:", files[0]);
      setFile(files[0]);
    } else {
      console.log("No files selected");
    }
  };

  const handleReset = () => {
    setFile(null);
    setProjectName("");
    setProductSummary("");
    setDeadline("");
    setDurationDays(30);
    setStatus("open");
  };

  const calculateDurationFromDate = (deadlineDate) => {
    if (!deadlineDate) return 30;
    
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 30;
  };

  const handleDeadlineChange = (e) => {
    const newDeadline = e.target.value;
    setDeadline(newDeadline);
    setDurationDays(calculateDurationFromDate(newDeadline));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ message: '', type: '' }); // Reset status on new submission

    console.log("Submit clicked. Current file state:", file);
    console.log("File exists check:", !!file);
    console.log("File object details:", file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file');

    // Validate all required fields
    if (!file) {
      console.log("Validation failed: No file selected");
      setSubmitStatus({ message: t.choosePDFDOC || 'Please select a file first.', type: 'error' });
      return;
    }

    if (!projectName.trim()) {
      console.log("Validation failed: Project name is empty");
      setSubmitStatus({ message: 'Project name is required.', type: 'error' });
      return;
    }

    if (!productSummary.trim()) {
      console.log("Validation failed: Product summary is empty");
      setSubmitStatus({ message: 'Product requirement summary is required.', type: 'error' });
      return;
    }

    if (!deadline) {
      console.log("Validation failed: Deadline is empty");
      setSubmitStatus({ message: 'Deadline date is required.', type: 'error' });
      return;
    }

    const rfpData = {
      projectName: projectName.trim(),
      productSummary: productSummary.trim(),
      deadline: deadline,
      durationDays: durationDays,
      status: status,
      file: file
    };

    console.log("RFP data being saved:", rfpData);

    try {
      const savedRFP = await localStorageService.saveRFP(rfpData);
      console.log("RFP saved successfully:", savedRFP);

      setSubmitStatus({ message: t.rfpSaved || 'RFP saved successfully!', type: 'success' });

      setTimeout(() => {
        window.location.href = "/browse-rfps";
      }, 2000);

    } catch (error) {
      console.error('Error saving RFP:', error);
      setSubmitStatus({ message: error.message || 'Failed to save RFP', type: 'error' });
    }
  };

  return (
    <div className="upload-rfp-app">
      <div className="upload-card">
        <div className="card-heading">
          <h1>{t.uploadTitle}</h1>
          <p>{t.uploadSubtitle}</p>
        </div>

        {submitStatus.message && (
          <div className={`submit-status ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="left-column">
              <div className="field">
                <label className="field-label">{t.projectName}</label>
                <div className="input-shell">
                  <span className="input-icon">&#128195;</span>
                  <input 
                    type="text" 
                    value={projectName} 
                    onChange={e=>setProjectName(e.target.value)} 
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">{t.deadlineDate}</label>
                <div className="input-shell">
                  <span className="input-icon">&#128197;</span>
                  <input 
                    type="date" 
                    value={deadline} 
                    onChange={handleDeadlineChange} 
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">{t.projectDuration}</label>
                <div className="input-shell">
                  <span className="input-icon">&#9200;</span>
                  <input 
                    type="number" 
                    value={durationDays} 
                    readOnly
                    className="readonly-input"
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">{t.status}</label>
                <div className="input-shell">
                  <span className="status-dot"></span>
                  <select 
                    value={status} 
                    onChange={e=>setStatus(e.target.value)}
                  >
                    <option value="open">{t.open}</option>
                    <option value="extended">{t.extended}</option>
                    <option value="closed">{t.closed}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="field">
                <label className="field-label">{t.productRequirementSummary}</label>
                <div className="textarea-shell">
                  <textarea 
                    maxLength="100" 
                    value={productSummary} 
                    onChange={e=>setProductSummary(e.target.value)} 
                  />
                  <span className="word-limit">100 words</span>
                </div>
              </div>

              <div className="field">
                <label className="field-label">{t.uploadRFP_PDF_DOC}</label>
                <div 
                  className={`drop-zone ${dragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="fileUpload" 
                    style={{display: 'none'}} 
                    onChange={handleFileChange} 
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="fileUpload" className="drop-zone-label">
                    <div className="doc-icons">
                      <span className="pdf">PDF</span>
                      <span className="doc">DOC</span>
                    </div>
                    <p>{t.dragAndDrop}</p>
                  </label>
                </div>
                {file && (
                  <div className="uploading-pill">
                    {t.uploading}: {file.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary">{t.saveAndUpload} &#128228;</button>
            <button type="button" className="ghost" onClick={handleReset}>{t.resetForm}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadRFP;