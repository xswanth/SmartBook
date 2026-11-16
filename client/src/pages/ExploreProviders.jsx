import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ExploreProviders() {
  const [providers, setProviders] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/providers?category=${category}&search=${search}`)
      .then((res) => res.json())
      .then((data) => setProviders(Array.isArray(data) ? data : []));
  }, [category, search]);

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h2>Find a Service Provider</h2>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px' }}>
          <option value="all">All Categories</option>
          <option value="doctor">Doctors</option>
          <option value="hospital">Hospitals</option>
          <option value="salon">Salons</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* TODO (Member 2): Improve card styling, add location filter & provider detail modal */}
      {providers.length === 0 ? (
        <p>No approved providers found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {providers.map((p) => (
            <div key={p.id} style={{ border: '1px solid #444', padding: '16px', borderRadius: '8px' }}>
              <h3>{p.name} ({p.category})</h3>
              <p>📍 {p.location || 'Location not set'} | 🕒 {p.working_days} ({p.start_time} - {p.end_time})</p>
              <p>{p.description}</p>
              <Link to={`/book/${p.id}`}>
                <button style={{ padding: '8px 14px', cursor: 'pointer' }}>Book Appointment</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExploreProviders;