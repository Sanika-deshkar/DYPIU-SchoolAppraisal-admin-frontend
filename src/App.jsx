import React, { useState, useEffect } from 'react';
import { getUniversities } from './api/adminApi';
import { Navbar } from './components/Navbar';
import { UniversityManager } from './components/UniversityManager';
import { UniversityLeadershipModal } from './components/UniversityLeadershipModal';

export default function App() {
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [leadershipModalUni, setLeadershipModalUni] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUniversities = async () => {
    try {
      const data = await getUniversities();
      setUniversities(data || []);
      if (data && data.length > 0) {
        setSelectedUniversity((current) => {
          if (!current) return data[0];
          return data.find((u) => u.id === current.id) || data[0];
        });
      } else {
        setSelectedUniversity(null);
      }
    } catch (err) {
      console.error('Failed to load universities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
    const onFocus = () => loadUniversities();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadUniversities();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <h5 className="fw-bold text-dark">Initializing SaaS Super Admin Console...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelectUniversity={(u) => setSelectedUniversity(u)}
        onOpenLeadership={(u) => setLeadershipModalUni(u)}
      />

      <main className="flex-grow-1 container-fluid py-4 px-md-5">
        <UniversityManager
          universities={universities}
          onReload={loadUniversities}
          onSelectUniversity={(u) => setSelectedUniversity(u)}
          selectedUniversity={selectedUniversity}
        />
      </main>

      {/* Leadership Provisioning Modal (IQAC & VC credentials) */}
      <UniversityLeadershipModal
        university={leadershipModalUni}
        isOpen={!!leadershipModalUni}
        onClose={() => {
          setLeadershipModalUni(null);
          loadUniversities();
        }}
      />
    </div>
  );
}
