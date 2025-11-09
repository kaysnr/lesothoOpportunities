// src/components/LesothoOpportunities.js
import React, { useState, useEffect } from 'react';
import '../styles/LesothoOpportunities.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const LesothoOpportunities = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('ADMIN');
  const [activeSidebar, setActiveSidebar] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [companies, setCompanies] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companiesQuery = query(collection(db, 'companies'), where('isActive', '==', true));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companyList = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Company',
          job: doc.data().featuredJob || 'Job Opportunities',
          location: doc.data().location || 'Lesotho',
          salary: doc.data().salaryRange || 'Competitive',
          badge: 'New',
          image: doc.data().logoUrl || 'https://via.placeholder.com/800x400?text=Company'
        }));

        const institutionsQuery = query(collection(db, 'institutions'), where('isActive', '==', true));
        const institutionsSnapshot = await getDocs(institutionsQuery);
        const institutionList = [];
        
        for (const instDoc of institutionsSnapshot.docs) {
          const instData = instDoc.data();
          const coursesQuery = query(
            collection(db, 'courses'),
            where('institutionId', '==', instDoc.id),
            where('isActive', '==', true)
          );
          const coursesSnapshot = await getDocs(coursesQuery);
          const courses = coursesSnapshot.docs.map(c => c.data());
          const course = courses[0] || { program: 'Programs Available', duration: 'Various', type: 'Full-time' };

          institutionList.push({
            id: instDoc.id,
            name: instData.name || 'Institution',
            program: course.program,
            duration: course.duration,
            type: course.type,
            badge: 'Popular',
            image: instData.logoUrl || '  https://via.placeholder.com/800x400?text=Institution'
          });
        }

        setCompanies(companyList);
        setInstitutions(institutionList);
      } catch (error) {
        console.error('Error fetching ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ NAVIGATION LOGIC ADDED HERE
  const handleNavClick = (nav) => {
    setActiveNav(nav);
    if (nav === 'Student') {
      navigate('/student-auth');
    } else if (nav === 'Institution') {
      navigate('/institute-auth');
    } else if (nav === 'Company') {
      navigate('/company-auth');
    } else if (nav === 'ADMIN') {
      navigate('/admin-auth');
    }
  };

  const handleSidebarClick = (item) => {
    setActiveSidebar(item);
  };

  const handleApply = (type, id) => {
    alert(`Apply for ${type} #${id}`);
  };

  const handleEnroll = (program, id) => {
    alert(`Enroll in ${program} #${id}`);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      alert(`Searching for: ${searchQuery}`);
    }
  };

  if (loading) {
    return (
      <div className="lo-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading opportunities...
      </div>
    );
  }

  return (
    <div className="lo-container">
      <header className="lo-header">
        <div className="lo-logo">
          <FontAwesomeIcon icon={faBriefcase} className="lo-logo-icon" />
          <span className="lo-logo-text">Lesotho Opportunities</span>
        </div>
        <nav className="lo-nav-menu">
          {['ADMIN', 'Institution', 'Company', 'Student'].map((nav) => (
            <div 
              key={nav}
              className={`lo-nav-item ${activeNav === nav ? 'active' : ''}`}
              onClick={() => handleNavClick(nav)}
            >
              <i className={`fas ${
                nav === 'ADMIN' ? 'fa-user-tie' :
                nav === 'Institution' ? 'fa-university' :
                nav === 'Company' ? 'fa-building' :
                'fa-graduation-cap'
              }`}></i>
              <span>{nav}</span>
            </div>
          ))}
        </nav>
        <div className="lo-user-actions">
          <div className="lo-search-bar">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search opportunities..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
            />
          </div>
          <div className="lo-notification">
            <i className="far fa-bell"></i>
            <span className="lo-notification-badge">3</span>
          </div>
          <div className="lo-profile">
            <i className="far fa-user-circle"></i>
          </div>
        </div>
      </header>

      <div className="lo-main-container">
        <div className="lo-main-content">
          <aside className="lo-sidebar">
            <div className="lo-sidebar-section">
              <h3 className="lo-sidebar-title"><i className="fas fa-chart-line"></i> Dashboard</h3>
              <ul className="lo-sidebar-menu">
                {['Overview', 'Job Listings', 'Education Programs', 'Applicants', 'Settings'].map((item) => (
                  <div 
                    key={item}
                    className={`lo-sidebar-item ${activeSidebar === item ? 'active' : ''}`}
                    onClick={() => handleSidebarClick(item)}
                  >
                    <i className={`fas ${item === 'Overview' ? 'fa-home' : 
                      item === 'Job Listings' ? 'fa-briefcase' : 
                      item === 'Education Programs' ? 'fa-graduation-cap' : 
                      item === 'Applicants' ? 'fa-users' : 'fa-cog'}`}></i>
                    {item}
                  </div>
                ))}
              </ul>
            </div>
          </aside>
          
          <main className="lo-content-area">
            <section className="lo-banner animate-fade-in-up">
              <div className="lo-banner-content">
                <h1 className="lo-banner-title">Discover Your Future in Lesotho</h1>
                <p className="lo-banner-subtitle">Find the perfect job opportunity or educational program tailored to your skills and aspirations.</p>
                <button className="lo-cta-button">Explore All Opportunities</button>
              </div>
            </section>
            
            <section className="lo-companies-section">
              <div className="lo-section-header">
                <h2 className="lo-section-title"><i className="fas fa-building"></i> Featured Companies</h2>
                <button className="lo-view-all">View All Companies <i className="fas fa-arrow-right"></i></button>
              </div>
              <div className="lo-grid-container">
                {companies.slice(0, 3).map((company) => (
                  <div key={company.id} className="lo-grid-item animate-fade-in-up">
                    <div className="lo-grid-image">
                      <img src={company.image} alt={company.name} />
                      <div className="lo-badge">{company.badge}</div>
                    </div>
                    <div className="lo-grid-content">
                      <div className="lo-company-name">
                        <i className="fas fa-building"></i> {company.name}
                      </div>
                      <div className="lo-job-title">{company.job}</div>
                      <div className="lo-job-details">
                        <span><i className="fas fa-map-marker-alt"></i> {company.location}</span>
                        <span><i className="fas fa-dollar-sign"></i> {company.salary}</span>
                      </div>
                      <button className="lo-apply-button" onClick={() => handleApply('job', company.id)}>
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="lo-institutions-section">
              <div className="lo-section-header">
                <h2 className="lo-section-title"><i className="fas fa-university"></i> Featured Institutions</h2>
                <button className="lo-view-all">View All Institutions <i className="fas fa-arrow-right"></i></button>
              </div>
              <div className="lo-grid-container">
                {institutions.slice(0, 3).map((inst) => (
                  <div key={inst.id} className="lo-grid-item animate-fade-in-up">
                    <div className="lo-grid-image">
                      <img src={inst.image} alt={inst.name} />
                      <div className="lo-badge">{inst.badge}</div>
                    </div>
                    <div className="lo-grid-content">
                      <div className="lo-institution-name">
                        <i className="fas fa-university"></i> {inst.name}
                      </div>
                      <div className="lo-program-name">{inst.program}</div>
                      <div className="lo-job-details">
                        <span><i className="fas fa-calendar-alt"></i> {inst.duration}</span>
                        <span><i className="fas fa-book"></i> {inst.type}</span>
                      </div>
                      <button className="lo-enroll-button" onClick={() => handleEnroll(inst.program, inst.id)}>
                        Enroll Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <footer className="lo-footer">
        <div className="lo-footer-logo">Lesotho Opportunities</div>
        <div className="lo-footer-links">
          {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service', 'Help Center'].map((link) => (
            <button key={link} className="lo-footer-link">{link}</button>
          ))}
        </div>
        <div className="lo-copyright">© 2025 Lesotho Opportunities. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LesothoOpportunities; 


