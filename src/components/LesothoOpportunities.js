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
          image: doc.data().logoUrl || 'https://via.placeholder.com/800x400/5d47e6/ffffff?text=Company+Logo'
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
            image: instData.logoUrl || 'https://via.placeholder.com/800x400/2ecc71/ffffff?text=Institution+Logo'
          });
        }

        setCompanies(companyList);
        setInstitutions(institutionList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="lo-spinner mb-3"></div>
          <p className="text-muted">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lo-container">
      {/* Header */}
      <header className="lo-header">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-lg-3 col-md-6">
              <div className="lo-logo">
                <FontAwesomeIcon icon={faBriefcase} className="lo-logo-icon" />
                <span className="lo-logo-text">Lesotho Opportunities</span>
              </div>
            </div>
            
            <div className="col-lg-6 d-none d-lg-block">
              <nav className="lo-nav-menu justify-content-center">
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
            </div>
            
            <div className="col-lg-3 col-md-6">
              <div className="lo-user-actions">
                <div className="lo-search-bar d-none d-md-flex">
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
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="d-lg-none bg-dark py-2">
        <div className="container-fluid">
          <div className="row g-1">
            {['ADMIN', 'Institution', 'Company', 'Student'].map((nav) => (
              <div key={nav} className="col-3">
                <button 
                  className={`lo-nav-mobile-btn w-100 ${activeNav === nav ? 'active' : ''}`}
                  onClick={() => handleNavClick(nav)}
                >
                  <i className={`fas ${
                    nav === 'ADMIN' ? 'fa-user-tie' :
                    nav === 'Institution' ? 'fa-university' :
                    nav === 'Company' ? 'fa-building' :
                    'fa-graduation-cap'
                  }`}></i>
                  <small>{nav}</small>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lo-main-container">
        <div className="lo-main-content">
          {/* Sidebar */}
          <aside className="lo-sidebar d-none d-lg-block">
            <div className="lo-sidebar-section">
              <h3 className="lo-sidebar-title">
                <i className="fas fa-chart-line"></i> Dashboard
              </h3>
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
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="lo-content-area">
            {/* Banner */}
            <section className="lo-banner">
              <div className="container">
                <div className="row align-items-center">
                  <div className="col-lg-8">
                    <div className="lo-banner-content">
                      <h1 className="lo-banner-title">Discover Your Future in Lesotho</h1>
                      <p className="lo-banner-subtitle">
                        Find the perfect job opportunity or educational program tailored to your skills and aspirations.
                      </p>
                      <button className="lo-cta-button">
                        Explore All Opportunities <i className="fas fa-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-lg-4 d-none d-lg-block">
                    <div className="text-center">
                      <i className="fas fa-rocket display-1 text-white opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Featured Companies */}
            <section className="lo-companies-section py-5">
              <div className="container">
                <div className="lo-section-header mb-4">
                  <h2 className="lo-section-title">
                    <i className="fas fa-building me-3"></i> Featured Companies
                  </h2>
                  <button className="lo-view-all">
                    View All Companies <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
                
                <div className="row g-4">
                  {companies.slice(0, 3).map((company) => (
                    <div key={company.id} className="col-lg-4 col-md-6">
                      <div className="lo-grid-item h-100">
                        <div className="lo-grid-image">
                          <img src={company.image} alt={company.name} className="img-fluid" />
                          <div className="lo-badge new">{company.badge}</div>
                        </div>
                        <div className="lo-grid-content">
                          <div className="lo-company-name">
                            <i className="fas fa-building me-2"></i> {company.name}
                          </div>
                          <div className="lo-job-title">{company.job}</div>
                          <div className="lo-job-details">
                            <span><i className="fas fa-map-marker-alt me-1"></i> {company.location}</span>
                            <span><i className="fas fa-dollar-sign me-1"></i> {company.salary}</span>
                          </div>
                          <button 
                            className="lo-apply-button w-100"
                            onClick={() => handleApply('job', company.id)}
                          >
                            Apply Now <i className="fas fa-paper-plane ms-2"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            
            {/* Featured Institutions */}
            <section className="lo-institutions-section py-5 bg-light">
              <div className="container">
                <div className="lo-section-header mb-4">
                  <h2 className="lo-section-title">
                    <i className="fas fa-university me-3"></i> Featured Institutions
                  </h2>
                  <button className="lo-view-all">
                    View All Institutions <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
                
                <div className="row g-4">
                  {institutions.slice(0, 3).map((inst) => (
                    <div key={inst.id} className="col-lg-4 col-md-6">
                      <div className="lo-grid-item h-100">
                        <div className="lo-grid-image">
                          <img src={inst.image} alt={inst.name} className="img-fluid" />
                          <div className="lo-badge popular">{inst.badge}</div>
                        </div>
                        <div className="lo-grid-content">
                          <div className="lo-institution-name">
                            <i className="fas fa-university me-2"></i> {inst.name}
                          </div>
                          <div className="lo-program-name">{inst.program}</div>
                          <div className="lo-job-details">
                            <span><i className="fas fa-calendar-alt me-1"></i> {inst.duration}</span>
                            <span><i className="fas fa-book me-1"></i> {inst.type}</span>
                          </div>
                          <button 
                            className="lo-enroll-button w-100"
                            onClick={() => handleEnroll(inst.program, inst.id)}
                          >
                            Enroll Now <i className="fas fa-graduation-cap ms-2"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-5">
              <div className="container">
                <div className="row g-4 text-center">
                  <div className="col-md-3 col-6">
                    <div className="lo-stat-card">
                      <div className="lo-stat-value">{companies.length}+</div>
                      <div className="lo-stat-label">Companies</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="lo-stat-card">
                      <div className="lo-stat-value">{institutions.length}+</div>
                      <div className="lo-stat-label">Institutions</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="lo-stat-card">
                      <div className="lo-stat-value">100+</div>
                      <div className="lo-stat-label">Opportunities</div>
                    </div>
                  </div>
                  <div className="col-md-3 col-6">
                    <div className="lo-stat-card">
                      <div className="lo-stat-value">500+</div>
                      <div className="lo-stat-label">Students</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="lo-footer py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-4 text-center text-lg-start">
              <div className="lo-footer-logo">Lesotho Opportunities</div>
            </div>
            <div className="col-lg-4">
              <div className="lo-footer-links text-center">
                {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service', 'Help Center'].map((link) => (
                  <button key={link} className="lo-footer-link">{link}</button>
                ))}
              </div>
            </div>
            <div className="col-lg-4 text-center text-lg-end">
              <div className="lo-copyright">© 2025 Lesotho Opportunities. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LesothoOpportunities;