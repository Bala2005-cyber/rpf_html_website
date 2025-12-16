import React, { useState, useEffect } from 'react';
import './Browserfp.css';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';
import localStorageService from './localStorageService';

const BrowseRFPs = () => {
    const { language } = useLanguage();
    const t = translations[language];
    const [rfps, setRfps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('recent');
    const [sortKey] = useState('uploadedAt');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRfp, setEditingRfp] = useState(null);
    const [editForm, setEditForm] = useState({});

    const loadRfps = async (tab = "recent", sort = "uploadedAt") => {
        setLoading(true);
        setError(null);
        try {
            const items = localStorageService.getRFPsByStatus(tab);
            setRfps(items);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Try to load data from URL first
        const urlData = localStorageService.loadDataFromURL();
        if (urlData) {
            setRfps(urlData);
            setLoading(false);
        } else {
            loadRfps(activeFilter, sortKey);
        }
    }, []);

    useEffect(() => {
        if (rfps.length > 0) {
            loadRfps(activeFilter, sortKey);
        }
    }, [activeFilter, sortKey]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleDeleteRfp = async (rfpId) => {
        if (!window.confirm('Are you sure you want to delete this RFP?')) {
            return;
        }

        try {
            console.log('Attempting to delete RFP with ID:', rfpId);
            localStorageService.deleteRFP(rfpId);
            
            // Refresh the RFP list
            loadRfps(activeFilter, sortKey);
        } catch (error) {
            console.error('Error deleting RFP:', error);
            alert(`Failed to delete RFP: ${error.message}`);
        }
    };

    const handleEditRfp = (rfp) => {
        setEditingRfp(rfp._id);
        setEditForm({
            projectName: rfp.projectName,
            productSummary: rfp.productSummary,
            deadline: new Date(rfp.deadline).toISOString().split('T')[0],
            durationDays: rfp.durationDays,
            status: rfp.status
        });
    };

    const handleSaveRfp = async (rfpId) => {
        try {
            localStorageService.updateRFP(rfpId, editForm);
            
            // Refresh the RFP list
            loadRfps(activeFilter, sortKey);
            setEditingRfp(null);
            setEditForm({});
        } catch (error) {
            console.error('Error updating RFP:', error);
            alert(`Failed to update RFP: ${error.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingRfp(null);
        setEditForm({});
    };

    const handleViewDocument = (rfp) => {
        if (!rfp.fileData) return;
        
        // Create a new blob URL for immediate PDF loading
        const fileUrl = localStorageService.getFileUrl(rfp.fileData);
        if (fileUrl) {
            // Open in new window for better PDF viewing
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${rfp.fileName || 'Document'}</title>
                        <style>
                            body { margin: 0; padding: 0; }
                            embed { width: 100%; height: 100vh; }
                        </style>
                    </head>
                    <body>
                        <embed src="${fileUrl}" type="application/pdf" />
                    </body>
                    </html>
                `);
                newWindow.document.close();
            }
        }
    };

    const handleDownloadDocument = (rfp) => {
        if (!rfp.fileData) return;
        
        const downloadUrl = localStorageService.getDownloadUrl(rfp.fileData, rfp.fileName);
        if (downloadUrl) {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = rfp.fileName || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExportData = () => {
        try {
            localStorageService.downloadRFPData('rfp_data.json');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        }
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = e.target.result;
                const importedRfps = localStorageService.importRFPData(jsonData, true);
                loadRfps(); // Reload the data
                alert(`Successfully imported ${importedRfps.length} RFPs`);
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset the file input
        event.target.value = '';
    };

    const handleShareData = () => {
        try {
            const shareableUrl = localStorageService.shareDataViaURL();
            if (shareableUrl) {
                navigator.clipboard.writeText(shareableUrl).then(() => {
                    alert('Shareable link copied to clipboard! Share this link with others to show them your RFPs.');
                }).catch(() => {
                    alert('Shareable link: ' + shareableUrl);
                });
            } else {
                alert('Failed to create shareable link');
            }
        } catch (error) {
            console.error('Share failed:', error);
            alert('Failed to create shareable link');
        }
    };

    const handleEditFormChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const filteredRfps = rfps.filter(rfp => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
                          rfp.projectName.toLowerCase().includes(searchTermLower) ||
                          rfp.productSummary.toLowerCase().includes(searchTermLower) ||
                          rfp.status.toLowerCase().includes(searchTermLower) ||
                          rfp.deadline.toLowerCase().includes(searchTermLower);
    return matchesSearch;
});

return (
    <div className="browse-rfp-app">
        <main className="browse-main">
            <div className="filter-controls">
                <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={handleSearchChange} />
                </div>
                <div className="filter-tabs">
                    <button onClick={() => setActiveFilter('recent')} className={activeFilter === 'recent' ? 'active' : ''}>{t.recentlyUploaded}</button>
                    <button onClick={() => setActiveFilter('completed')} className={activeFilter === 'completed' ? 'active' : ''}>{t.deadlineCompleted}</button>
                    <button onClick={() => setActiveFilter('extended')} className={activeFilter === 'extended' ? 'active' : ''}>{t.extendedRFPs}</button>
                </div>
                <div className="data-controls">
                    <button onClick={handleExportData} className="export-btn">
                        <i className="fas fa-download"></i> Export Data
                    </button>
                    <label className="import-btn">
                        <i className="fas fa-upload"></i> Import Data
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleImportData} 
                            style={{ display: 'none' }} 
                        />
                    </label>
                    <button onClick={handleShareData} className="share-btn">
                        <i className="fas fa-share-alt"></i> Share RFPs
                    </button>
                </div>
            </div>

            <div className="rfp-grid">
                {loading && <p>Loading...</p>}
                {error && <p>Error: {error}</p>}
                {!loading && !error && filteredRfps.map(rfp => (
                    <div key={rfp._id} className={`rfp-card ${rfp.status.toLowerCase()}`}>
                        <div className="card-header">
                            <button 
                                onClick={() => handleEditRfp(rfp)}
                                className="edit-btn-header"
                            >
                                Edit
                            </button>
                            <span>{t.projectName}</span>
                            <div className="header-right">
                                <span className={`status-badge ${rfp.status.toLowerCase()}`}>{rfp.status}</span>
                                <button 
                                    onClick={() => handleDeleteRfp(rfp._id)}
                                    className="delete-btn-header"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        
                        {editingRfp === rfp._id ? (
                            <div className="edit-mode">
                                <div className="form-group">
                                    <label>Project Name:</label>
                                    <input
                                        type="text"
                                        value={editForm.projectName}
                                        onChange={(e) => handleEditFormChange('projectName', e.target.value)}
                                        className="edit-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Product Summary:</label>
                                    <textarea
                                        value={editForm.productSummary}
                                        onChange={(e) => handleEditFormChange('productSummary', e.target.value)}
                                        className="edit-textarea"
                                        rows="3"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Deadline:</label>
                                        <input
                                            type="date"
                                            value={editForm.deadline}
                                            onChange={(e) => handleEditFormChange('deadline', e.target.value)}
                                            className="edit-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Duration (days):</label>
                                        <input
                                            type="number"
                                            value={editForm.durationDays}
                                            onChange={(e) => handleEditFormChange('durationDays', e.target.value)}
                                            className="edit-input"
                                            min="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status:</label>
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => handleEditFormChange('status', e.target.value)}
                                            className="edit-select"
                                        >
                                            <option value="open">Open</option>
                                            <option value="extended">Extended</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="edit-actions">
                                    <button
                                        onClick={() => handleSaveRfp(rfp._id)}
                                        className="save-btn"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2>{rfp.projectName}</h2>
                                <div className="summary">
                                    <h3>{t.productRequirementSummary}</h3>
                                    <p>{rfp.productSummary}</p>
                                </div>
                                <div className="key-info">
                                    <h3>{t.keyInfo}</h3>
                                    <div className="info-grid">
                                        <div><span>Deadline: {new Date(rfp.deadline).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric' 
                                        })}</span></div>
                                        <div><span>{t.projectDuration}:</span><strong>{rfp.durationDays} days</strong></div>
                                    </div>
                                </div>
                                <div className="card-actions">
                                    <div className="document-link">
                                        <span className="link-label">{t.viewDocument}:</span>
                                        {rfp.fileData ? (
                                            <div className="document-actions">
                                                <button 
                                                    onClick={() => handleViewDocument(rfp)}
                                                    className="document-link-url"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {rfp.fileName || 'Document Link'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDownloadDocument(rfp)}
                                                    className="download-btn-small"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="no-file">No file available</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    ))}
                </div>

                <div className="pagination">
                    <button>{t.prev}</button>
                    <button className="active">1</button>
                    <button>2</button>
                    <button>3</button>
                    <span>...</span>
                    <button>{t.next}</button>
                </div>
            </main>
        </div>
    );
};

export default BrowseRFPs;