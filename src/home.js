import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from './train.png';
import { useLanguage } from './LanguageContext';
import { translations } from './translations';

const statusMeta = [
    { key: 'recent', icon: 'fas fa-upload', accent: 'accent-rose' },
    { key: 'deadline', icon: 'fas fa-calendar-check', accent: 'accent-cobalt' },
    { key: 'extended', icon: 'fas fa-history', accent: 'accent-cyan' },
];

const benefitMeta = [
    { key: 'secure', icon: 'fas fa-shield-alt' },
    { key: 'deadline', icon: 'fas fa-clock' },
    { key: 'vendor', icon: 'fas fa-users' },
];

const HERO_IMAGE = heroImage;

const Home = () => {
    const { language } = useLanguage();
    const t = translations[language];

    return (
        <div className="metro-app">
            <div className="blur-blob blob-one" />
            <div className="blur-blob blob-two" />
            <div className="page-shell">
                <main>
                    <section className="hero-panel">
                        <div className="hero-gradient" />
                        <div className="hero-text">
                            <p className="eyebrow">{t.eyebrow}</p>
                            <h1>
                                <span>{t.heroTitle}</span>
                            </h1>
                            <p className="lead">{t.heroDescription}</p>
                            <div className="hero-actions">
                                <Link to="/upload-rfp" className="cta upload">
                                    <i className="fas fa-upload" />
                                    {t.cta.upload}
                                </Link>
                                <Link to="/browse-rfps" className="cta browse">
                                    <i className="fas fa-folder-open" />
                                    {t.cta.browse}
                                </Link>
                            </div>
                        </div>
                        <div className="hero-media">
                            <div className="media-frame">
                                <img
                                    src={HERO_IMAGE}
                                    alt="Metro Train at platform"
                                />
                                <div className="media-glow" />
                            </div>
                        </div>
                    </section>

                    <section className="status-cards">
                        {statusMeta.map((item) => {
                            const copy = t.statuses[item.key];
                            return (
                                <article className="status-card" key={item.key}>
                                    <div className={`card-accent ${item.accent}`} />
                                    <div className="status-icon">
                                        <i className={item.icon} />
                                    </div>
                                    <h3>{copy.title}</h3>
                                    <p>{copy.description}</p>
                                </article>
                            );
                        })}
                    </section>

                    <section className="secure-summary">
                        <div className="summary-heading">
                            <h2>{t.secureTitle}</h2>
                            <p>{t.secureDescription}</p>
                        </div>
                        <ul className="benefits">
                            {benefitMeta.map((benefit) => (
                                <li key={benefit.key}>
                                    <span className="benefit-icon">
                                        <i className={benefit.icon} />
                                    </span>
                                    {t.benefits[benefit.key]}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <footer className="page-footer">
                    <nav>
                        {t.footerNav.map((label) => (
                            <button key={label} type="button" className="footer-link">
                                {label}
                            </button>
                        ))}
                    </nav>
                    <p>{t.footerNote}</p>
                </footer>
            </div>
        </div>
    );
};

export default Home;