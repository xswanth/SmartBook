
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ExploreProviders.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ExploreProviders() {
  const [providers, setProviders] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch providers whenever filters change
  useEffect(() => {
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          category,
          search: search.trim(),
          location: location.trim()
        });

        const response = await fetch(
          `${API_URL}/api/providers?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Unable to fetch providers');
        }

        const data = await response.json();
        setProviders(Array.isArray(data) ? data : []);

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setProviders([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, search, location]);

  // Fetch individual provider details
  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setSelectedProvider(null);
      setError('');

      const response = await fetch(
        `${API_URL}/api/providers/${encodeURIComponent(id)}`
      );

      if (!response.ok) {
        throw new Error('Unable to load provider details');
      }

      const data = await response.json();
      setSelectedProvider(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setLocation('');
  };

  // Close details modal using Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedProvider(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Format field names for the details modal
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="explore-page">

      {/* Page Heading */}
      <div className="explore-header">
        <span className="explore-tag">SMARTBOOK SERVICES</span>
        <h1>Find Your Perfect Service Provider</h1>
        <p>
          Discover trusted professionals and book your
          appointment with ease.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="search-panel">

        <input
          type="text"
          placeholder="Search provider by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search provider by name"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          <option value="doctor">Doctors</option>
          <option value="hospital">Hospitals</option>
          <option value="salon">Salons</option>
          <option value="other">Other</option>
        </select>

        <input
          type="text"
          placeholder="Enter location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Search by location"
        />

        <button
          type="button"
          className="clear-button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* Results */}
      <div className="results-heading">
        <h2>Available Providers</h2>
        <span>{providers.length} providers found</span>
      </div>

      {loading && (
        <div className="status-message">
          Loading providers...
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && providers.length === 0 && (
        <div className="empty-state">
          <h3>No providers found</h3>
          <p>Try changing your search or filters.</p>
          <button onClick={clearFilters}>
            Reset Search
          </button>
        </div>
      )}

      {/* Provider Cards */}
      {!loading && providers.length > 0 && (
        <div className="provider-grid">

          {providers.map((provider) => (
            <div className="provider-card" key={provider.id}>

              <div className="provider-card-top">
                <span className="category-badge">
                  {provider.category}
                </span>
              </div>

              <h3>{provider.name}</h3>

              <p className="provider-location">
                📍 {provider.location || 'Location not available'}
              </p>

              <p className="provider-description">
                {provider.description || 'No description available.'}
              </p>

              <div className="provider-timing">
                <p>
                  <strong>Working Days:</strong>{' '}
                  {provider.working_days || 'Not specified'}
                </p>

                <p>
                  <strong>Working Hours:</strong>{' '}
                  {provider.start_time || '--'} - {provider.end_time || '--'}
                </p>
              </div>

              <div className="provider-actions">

                <button
                  className="details-button"
                  onClick={() => handleViewDetails(provider.id)}
                >
                  View Details
                </button>

                <Link
                  to={`/book/${provider.id}`}
                  className="book-button"
                >
                  Book Appointment
                </Link>

              </div>
            </div>
          ))}

        </div>
      )}

      {/* Provider Details Modal */}
      {(selectedProvider || detailsLoading) && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProvider(null)}
        >
          <div
            className="provider-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-modal-title"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setSelectedProvider(null)}
              aria-label="Close details"
            >
              ×
            </button>

            {detailsLoading ? (
              <p>Loading provider details...</p>
            ) : selectedProvider && (
              <>
                <span className="category-badge">
                  {selectedProvider.category}
                </span>

                <h2 id="provider-modal-title">
                  {selectedProvider.name}
                </h2>

                <div className="details-list">
                  {Object.entries(selectedProvider)
                    .filter(([key, value]) =>
                      !['id', 'is_approved'].includes(key) &&
                      value !== null &&
                      value !== undefined &&
                      value !== ''
                    )
                    .map(([key, value]) => (
                      <div className="detail-row" key={key}>
                        <strong>{formatLabel(key)}</strong>
                        <span>
                          {Array.isArray(value)
                            ? value.join(', ')
                            : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                <Link
                  to={`/book/${selectedProvider.id}`}
                  className="book-button modal-book"
                >
                  Book Appointment
                </Link>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default ExploreProviders;
