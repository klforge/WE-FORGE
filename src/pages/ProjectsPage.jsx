import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import projectService from '../services/projectService';
import './ProjectsPage.css';

const ProjectsPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        projectService.getAll()
            .then(setProjects)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="projects-page">
            <div className="projects-page__topbar">
                <button className="projects-page__back" onClick={() => navigate('/')}>← Back</button>
            </div>
            <div className="projects-page__header">
                <h1 className="projects-page__title">Club Projects</h1>
                <p className="projects-page__subtitle">Built by KLForge members</p>
            </div>

            {loading && <div className="projects-page__loading">Loading projects...</div>}

            {!loading && projects.length === 0 && (
                <div className="projects-page__empty">No projects yet — check back soon!</div>
            )}

            <div className="projects-page__grid">
                {projects.map((p) => (
                    <div key={p.id} className="projects-page__card">
                        <div className="projects-page__card-header">
                            <h2 className="projects-page__card-name">{p.name}</h2>
                            <div className="projects-page__card-links">
                                {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="projects-page__link projects-page__link--github">GitHub ↗</a>}
                                {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer" className="projects-page__link projects-page__link--demo">Demo ↗</a>}
                            </div>
                        </div>
                        {p.description && <p className="projects-page__card-desc">{p.description}</p>}
                        {p.technologies.length > 0 && (
                            <div className="projects-page__tags">
                                {p.technologies.map((t) => (
                                    <span key={t} className="projects-page__tag">{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsPage;
