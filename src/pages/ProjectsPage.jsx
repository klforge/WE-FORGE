import React, { useState, useEffect } from 'react';
import { FolderKanban, Github, ExternalLink } from 'lucide-react';
import BackButton from '../components/BackButton';
import ComingSoon from '../components/ComingSoon';
import projectService from '../services/projectService';
import './ProjectsPage.css';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        projectService.getAll()
            .then(data => {
                setProjects(data || []);
            })
            .catch(err => {
                console.error("Failed to load projects", err);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="projects-page__loading">Loading projects...</div>;
    }

    if (projects.length === 0) {
        return (
            <ComingSoon 
                title="Projects Coming Soon" 
                message="We are currently building and compiling our showcase." 
                theme="cyan"
            />
        );
    }

    return (
        <div className="projects-page">
            <div className="projects-page__back">
                <BackButton to="/" />
            </div>
            
            <header className="projects-page__hero">
                <h1 className="projects-page__title">Our Projects</h1>
                <p className="projects-page__subtitle">
                    Showcasing the work and innovation of our members.
                </p>
            </header>

            <div className="projects-page__grid">
                {projects.map(project => (
                    <div key={project.id} className="project-card">
                        {project.imageUrl ? (
                            <img src={project.imageUrl} alt={project.name} className="project-card__image" />
                        ) : (
                            <div className="project-card__image-placeholder">
                                <FolderKanban size={48} className="project-card__icon" />
                            </div>
                        )}
                        <div className="project-card__content">
                            <h2 className="project-card__name">{project.name}</h2>
                            <p className="project-card__desc">{project.description}</p>
                            
                            {project.technologies && project.technologies.length > 0 && (
                                <div className="project-card__tech">
                                    {project.technologies.map(t => (
                                        <span key={t} className="project-card__tag">{t}</span>
                                    ))}
                                </div>
                            )}

                            <div className="project-card__actions">
                                {project.github && (
                                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-card__link">
                                        <Github size={18} /> Source code
                                    </a>
                                )}
                                {project.demo && (
                                    <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project-card__link project-card__link--demo">
                                        <ExternalLink size={18} /> Live Demo
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsPage;
