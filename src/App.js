import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import './App.css';
import './home.css';
import Home from './home.js';
import './uploadrfp.css';
import UploadRFP from './uploadrfp.js';
import BrowseRFPs from './Browserfp.js';
import Navbar from './Navbar.js';

function App() {
  // quick type check – these MUST log "function"
  console.log("Home typeof:", typeof Home);
  console.log("BrowseRFPs typeof:", typeof BrowseRFPs);
  console.log("UploadRFP typeof:", typeof UploadRFP);

  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse-rfps" element={<BrowseRFPs />} />
            <Route path="/upload-rfp" element={<UploadRFP />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
