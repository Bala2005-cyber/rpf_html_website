import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import logo from './logo.png';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';

const Navbar = () => {
  const { language, switchLanguage } = useLanguage();
  const t = translations[language];

  const handleLanguageChange = () => {
    const newLang = language === 'en' ? 'hi' : 'en';
    switchLanguage(newLang);
  };

  return (
    <header className="app-header">
      <div className="brand-container">
        <img src={logo} alt="Delhi Metro Project Logo" className="logo" />
        <span className="brand-name">{t.brandName}</span>
      </div>
      <nav className="main-nav">
        <NavLink to="/" exact activeClassName="active-link">{t.navHome}</NavLink>
        <NavLink to="/upload-rfp" activeClassName="active-link">{t.navUpload}</NavLink>
        <NavLink to="/browse-rfps" activeClassName="active-link">{t.navBrowse}</NavLink>
      </nav>
      <div className="header-actions">
        <button className="action-btn lang-btn" onClick={handleLanguageChange}>
          <span role="img" aria-label="language">&#127462;</span> {t.langButton}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
