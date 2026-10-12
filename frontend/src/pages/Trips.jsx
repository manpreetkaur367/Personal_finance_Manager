import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import tripService from '../services/tripService';
import formatCurrency from '../utils/formatCurrency';

const defaultTripForm = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  description: '',
  budget: '0',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const normalizeTripList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.trips)) return payload.trips;
  if (Array.isArray(payload?.data?.trips)) return payload.data.trips;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const getTripIdFromResponse = (payload) => {
  const trip = payload?.trip || payload?.data?.trip || payload?.data?.data?.trip;
  return trip?._id || null;
};

const getTripFromResponse = (payload) => payload?.trip || payload?.data?.trip || payload?.data?.data?.trip || null;
const idString = (value) => value == null ? '' : String(value);
const getTripErrorMessage = (error, fallback) => {
  const message = error?.message;
  // Never show low-level runtime exceptions in the page. They are not actionable
  // for users and can leak implementation details from an API response.
  if (!message || /Cannot read properties of (?:null|undefined).*toString/i.test(message)) return fallback;
  return message;
};

const Trips = () => {
  const [searchParams] = useSearchParams();
  const requestedTripId = searchParams.get('trip');
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(requestedTripId || '');
  const [loading, setLoading] = useState(true);
  const [tripForm, setTripForm] = useState(defaultTripForm);
  const [editingTripId, setEditingTripId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadTrips = useCallback(async (preferredTripId = null, { showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      setError('');

      const response = await tripService.getTrips();
      const tripList = normalizeTripList(response);
      setTrips(tripList);

      if (preferredTripId && tripList.some((trip) => trip._id === preferredTripId)) {
        setSelectedTripId(preferredTripId);
        return;
      }

      if (tripList.length) {
        const nextSelectedTripId = tripList.some((trip) => trip._id === selectedTripId) ? selectedTripId : tripList[0]._id;
        setSelectedTripId(nextSelectedTripId);
      } else {
        setSelectedTripId('');
      }
    } catch (err) {
      // Keep any trips already loaded or just created visible if refresh fails.
      if (!preferredTripId) setError(getTripErrorMessage(err, ''));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [selectedTripId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((trip) => trip._id === selectedTripId) || trips[0] || null;
  }, [selectedTripId, trips]);

  useEffect(() => {
    if (selectedTrip && !selectedTripId) {
      setSelectedTripId(selectedTrip._id);
    }
  }, [selectedTrip, selectedTripId]);

  const handleTripSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setError('');
    setSuccessMessage('');

    try {
      setSaving(true);
      const formData = new FormData(event.currentTarget);
      const formValues = {
        name: String(formData.get('name') ?? tripForm.name ?? '').trim(),
        destination: String(formData.get('destination') ?? tripForm.destination ?? '').trim(),
        startDate: String(formData.get('startDate') ?? tripForm.startDate ?? '').trim(),
        endDate: String(formData.get('endDate') ?? tripForm.endDate ?? '').trim(),
        description: String(formData.get('description') ?? tripForm.description ?? '').trim(),
        budget: Number(formData.get('budget') ?? tripForm.budget ?? 0),
      };

      if (!formValues.name || !formValues.destination || !formValues.startDate || !formValues.endDate) {
        setError('Trip name, destination, and dates are required.');
        return;
      }

      const parsedStart = new Date(formValues.startDate);
      const parsedEnd = new Date(formValues.endDate);

      if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
        setError('Please enter valid start and end dates.');
        return;
      }

      if (parsedEnd < parsedStart) {
        setError('End date cannot be earlier than the start date.');
        return;
      }

      const payload = {
        ...formValues,
        budget: Number(formValues.budget || 0),
      };

      let response;
      if (editingTripId) {
        response = await tripService.updateTrip(editingTripId, payload);
      } else {
        response = await tripService.createTrip(payload);
      }

      const createdTripId = getTripIdFromResponse(response);
      const savedTrip = getTripFromResponse(response);
      const successText = response?.message || response?.data?.message || 'Trip saved successfully.';

      setTripForm(defaultTripForm);
      setEditingTripId(null);
      if (savedTrip) {
        setTrips((current) => [savedTrip, ...current.filter((trip) => idString(trip._id) !== idString(savedTrip._id))]);
        setSelectedTripId(idString(savedTrip._id));
      }
      await loadTrips(createdTripId);
      setSuccessMessage(successText);
    } catch (err) {
      setError(getTripErrorMessage(err, 'Trip save failed.'));
    } finally {
      setSaving(false);
    }
  };

  const handleTripDelete = async (tripId) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await tripService.deleteTrip(tripId);
      await loadTrips();
    } catch (err) {
      setError(getTripErrorMessage(err, 'Unable to delete trip.'));
    }
  };

  return (
    <MainLayout title="Trips">
      <div className="toolbar-row">
        <button
          className="primary-button"
          onClick={() => {
            setEditingTripId(null);
            setTripForm(defaultTripForm);
          }}
        >
          Add Trip
        </button>
      </div>

      {successMessage && <div className="form-success">{successMessage}</div>}
      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loading-panel">Loading trips…</div>
      ) : (
        <div className="trip-grid">
          <div className="panel-card trip-list-panel">
            <h3>My Trips</h3>
            <div className="trip-list">
              {trips.length ? trips.map((trip) => (
                <button
                  key={trip._id}
                  type="button"
                  className={`trip-card ${selectedTrip && trip._id === selectedTrip._id ? 'active' : ''}`}
                  onClick={() => setSelectedTripId(trip._id)}
                >
                  <div className="trip-card-header">
                    <strong>{trip.name}</strong>
                    <span>{trip.destination}</span>
                  </div>
                  <p>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                  <small>{trip.members?.filter((member) => member.status === 'accepted').length || 0} members</small>
                </button>
              )) : <div className="empty-box">No trips yet.</div>}
            </div>

            <form className="form-card trip-form" onSubmit={handleTripSubmit}>
              <h3>{editingTripId ? 'Edit Trip' : 'Create Trip'}</h3>
              <div className="two-column-form">
                <label>
                  Name
                  <input name="name" value={tripForm.name} onChange={(event) => setTripForm((prev) => ({ ...prev, name: event.target.value }))} />
                </label>
                <label>
                  Destination
                  <input name="destination" value={tripForm.destination} onChange={(event) => setTripForm((prev) => ({ ...prev, destination: event.target.value }))} />
                </label>
                <label>
                  Start date
                  <input name="startDate" type="date" value={tripForm.startDate} onChange={(event) => setTripForm((prev) => ({ ...prev, startDate: event.target.value }))} />
                </label>
                <label>
                  End date
                  <input name="endDate" type="date" value={tripForm.endDate} onChange={(event) => setTripForm((prev) => ({ ...prev, endDate: event.target.value }))} />
                </label>
                <label className="full-width">
                  Description
                  <textarea name="description" rows="3" value={tripForm.description} onChange={(event) => setTripForm((prev) => ({ ...prev, description: event.target.value }))} />
                </label>
                <label>
                  Budget
                  <input name="budget" type="number" min="0" value={tripForm.budget} onChange={(event) => setTripForm((prev) => ({ ...prev, budget: event.target.value }))} />
                </label>
              </div>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Trip'}</button>
                {editingTripId && (
                  <button className="secondary-button" type="button" onClick={() => { setEditingTripId(null); setTripForm(defaultTripForm); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel-card trip-details-panel">
            {selectedTrip ? (
              <>
                <div className="trip-header-row">
                  <div>
                    <p className="eyebrow">Trip overview</p>
                    <h3>{selectedTrip.name}</h3>
                  </div>
                  <div className="button-row compact-row">
                    <button className="secondary-button" type="button" onClick={() => { setEditingTripId(selectedTrip._id); setTripForm({ name: selectedTrip.name, destination: selectedTrip.destination, startDate: selectedTrip.startDate ? new Date(selectedTrip.startDate).toISOString().slice(0, 10) : '', endDate: selectedTrip.endDate ? new Date(selectedTrip.endDate).toISOString().slice(0, 10) : '', description: selectedTrip.description || '', budget: String(selectedTrip.budget || 0) }); }}>
                      Edit
                    </button>
                    <button className="ghost-button" type="button" onClick={() => handleTripDelete(selectedTrip._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="trip-summary-grid">
                  <div className="summary-card compact-card">
                    <p>Total Expenses</p>
                    <h3>{formatCurrency(selectedTrip.summary?.totalExpenses || 0)}</h3>
                  </div>
                  <div className="summary-card compact-card">
                    <p>Remaining Budget</p>
                    <h3>{formatCurrency(selectedTrip.summary?.remainingBudget || 0)}</h3>
                  </div>
                  <div className="summary-card compact-card">
                    <p>Trip Budget</p>
                    <h3>{formatCurrency(selectedTrip.budget || 0)}</h3>
                  </div>
                </div>

                <div className="trip-section-grid">
                  <div className="form-card">
                    <h3>Itinerary</h3>
                    <div className="member-list">
                      {selectedTrip.itinerary?.length ? selectedTrip.itinerary.map((item) => (
                        <div key={item._id} className="member-row itinerary-row">
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.place} · {formatDate(item.date)} {item.time}</small>
                          </div>
                          <span>{formatCurrency(item.cost || 0)}</span>
                        </div>
                      )) : <div className="empty-box">No itinerary items yet.</div>}
                    </div>
                  </div>

                  <div className="form-card">
                    <h3>Trip Analytics</h3>
                    <div className="member-list">
                      {selectedTrip.summary?.categoryTotals?.map((item) => (
                        <div key={item.category} className="member-row">
                          <div>
                            <strong>{item.category}</strong>
                          </div>
                          <span>{formatCurrency(item.total)}</span>
                        </div>
                      )) || <div className="empty-box">No analytics yet.</div>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-box">Create a trip to get started.</div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Trips;
