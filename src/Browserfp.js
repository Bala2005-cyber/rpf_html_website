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
        loadRfps(activeFilter, sortKey);
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

    const handleEditFormChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const testConnection = async () => {
        try {
            console.log('Testing connection...');
            
            // First test a simple GET request
            console.log('Testing GET /health...');
            const getResponse = await fetch('http://localhost:4000/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('GET response status:', getResponse.status);
            console.log('GET response headers:', getResponse.headers);
            
            const getContentType = getResponse.headers.get('content-type');
            if (!getContentType || !getContentType.includes('application/json')) {
                const getResponseText = await getResponse.text();
                console.log('GET response is not JSON:', getResponseText);
                throw new Error(`GET request failed. Status: ${getResponse.status}, Content-Type: ${getContentType}. Response: ${getResponseText.substring(0, 200)}...`);
            }
            
            const getData = await getResponse.json();
            console.log('GET response data:', getData);
            
            // Now test the DELETE request
            console.log('Testing DELETE /test-delete/123...');
            const response = await fetch('http://localhost:4000/test-delete/123', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('Test response status:', response.status);
            const data = await response.json();
            console.log('Test response data:', data);
            alert('Connection test successful! Check console for details.');
        } catch (error) {
            console.error('Test connection failed:', error);
            alert(`Test connection failed: ${error.message}`);
        }
    };

    const filteredRfps = rfps.filter(rfp => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
                              rfp.projectName.toLowerCase().includes(searchTermLower) ||
                              rfp.productSummary.toLowerCase().includes(searchTermLower) ||
                              rfp.status.toLowerCase().includes(searchTermLower);
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
                                                    <a 
                                                        onClick={() => handleViewDocument(rfp)}
                                                        className="document-link-url"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {rfp.fileName || 'Document Link'}
                                                    </a>
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