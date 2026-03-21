'use client';

import React, { useState, useEffect } from 'react';
import { BellRing, AlertCircle, Info } from 'lucide-react';
import BackButton from '../../src/components/BackButton';
import ComingSoon from '../../src/components/ComingSoon';
import noticeService from '../../src/services/noticeService';
import './page.css';

const NoticesPage = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        noticeService.getAll()
            .then(data => {
                setNotices(data || []);
            })
            .catch(err => {
                console.error("Failed to load notices", err);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="notices-page__loading">Loading notices...</div>;
    }

    if (notices.length === 0) {
        return (
            <ComingSoon 
                title="No Detailed Notices yet" 
                message="We are currently preparing the announcements and notices section." 
                theme="cyan"
            />
        );
    }

    const getPriorityIcon = (prio) => {
        switch(prio) {
            case 'high': return <AlertCircle size={20} className="notice-card__icon notice-card__icon--high" />;
            case 'medium': return <BellRing size={20} className="notice-card__icon notice-card__icon--medium" />;
            default: return <Info size={20} className="notice-card__icon notice-card__icon--low" />;
        }
    };

    return (
        <div className="notices-page">
            <div className="notices-page__back">
                <BackButton />
            </div>
            
            <header className="notices-page__hero">
                <h1 className="notices-page__title">Club Notices</h1>
                <p className="notices-page__subtitle">
                    Latest announcements, updates, and official bulletins.
                </p>
            </header>

            <div className="notices-page__grid">
                {notices.map(notice => (
                    <div key={notice.id} className={`notice-card notice-card--${notice.priority || 'low'}`}>
                        <div className="notice-card__header">
                            {getPriorityIcon(notice.priority)}
                            <span className="notice-card__date">
                                {new Date(notice.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                }) }
                            </span>
                        </div>
                        <h2 className="notice-card__title">{notice.title}</h2>
                        <p className="notice-card__message">{notice.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NoticesPage;
