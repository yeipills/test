import { useState, useCallback, useEffect } from 'react';
import { MapPin, Navigation, Store, Clock, Phone, AlertCircle } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { productsAPI } from '../services/api';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '0.5rem',
};

// Santiago center
const center = {
  lat: -33.4489,
  lng: -70.6693,
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function StoreMap() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterLocal, setFilterLocal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [map, setMap] = useState(null);
  const [infoWindowStore, setInfoWindowStore] = useState(null);

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Fetch stores from API when user location is available
  useEffect(() => {
    const fetchStores = async () => {
      if (!userLocation) return;

      setLoadingStores(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/stores/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10`
        );
        if (response.ok) {
          const data = await response.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, [userLocation]);

  // Filter stores
  const filteredStores = stores.filter((store) => {
    if (filterOrganic && !store.hasOrganic) return false;
    if (filterLocal && !store.hasLocal) return false;
    return true;
  });

  // Map load callback
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  // Map unload callback
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Get user location
  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
          if (map) {
            map.panTo(userPos);
            map.setZoom(14);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  };

  // Open in Google Maps for directions
  const openInMaps = (store) => {
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : '';
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${store.lat},${store.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    window.open(url, '_blank');
  };

  // Center map on store
  const focusStore = (store) => {
    setSelectedStore(store);
    if (map) {
      map.panTo({ lat: store.lat, lng: store.lng });
      map.setZoom(15);
    }
    setInfoWindowStore(store);
  };

  // Check if API key is available
  const hasApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
        Mapa de Tiendas Cercanas
      </h1>

      {/* Filters and Location */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="store-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={getUserLocation}
            disabled={loading}
            className="btn"
            style={{
              background: userLocation ? '#10b981' : '#3b82f6',
              color: 'white',
              width: 'auto',
            }}
          >
            <Navigation size={16} />
            {loading ? 'Obteniendo...' : userLocation ? 'Ubicacion OK' : 'Mi ubicacion'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={filterOrganic}
              onChange={(e) => setFilterOrganic(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Organicos</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={filterLocal}
              onChange={(e) => setFilterLocal(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span>Locales</span>
          </label>
        </div>
      </div>

      {/* Main Content - Two columns on large screens */}
      <div className="wide-grid-2" style={{ alignItems: 'start' }}>
        {/* Google Map */}
        <div className="card" style={{ marginBottom: 0, padding: 0, overflow: 'hidden' }}>
        {loadError && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
            <div>Error al cargar Google Maps</div>
          </div>
        )}

        {!hasApiKey ? (
          <div
            style={{
              height: '300px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <AlertCircle size={40} style={{ color: '#d97706', marginBottom: '1rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem', textAlign: 'center' }}>
              API Key de Google Maps no configurada
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b45309', textAlign: 'center', maxWidth: '300px' }}>
              Agrega VITE_GOOGLE_MAPS_API_KEY en tu archivo .env para ver el mapa interactivo
            </div>
          </div>
        ) : !isLoaded ? (
          <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={userLocation || center}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                title="Tu ubicación"
              />
            )}

            {/* Store markers */}
            {filteredStores.map((store) => (
              <Marker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => setInfoWindowStore(store)}
                icon={{
                  url: selectedStore?.id === store.id
                    ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
              />
            ))}

            {/* Info window */}
            {infoWindowStore && (
              <InfoWindow
                position={{ lat: infoWindowStore.lat, lng: infoWindowStore.lng }}
                onCloseClick={() => setInfoWindowStore(null)}
              >
                <div style={{ padding: '0.25rem', maxWidth: '200px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {infoWindowStore.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {infoWindowStore.address}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {infoWindowStore.hasOrganic && (
                      <span style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>
                        Orgánicos
                      </span>
                    )}
                    {infoWindowStore.hasLocal && (
                      <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>
                        Locales
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openInMaps(infoWindowStore)}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Cómo llegar
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Store List */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={18} style={{ color: '#3b82f6' }} />
          Tiendas ({filteredStores.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="product-item"
              style={{
                padding: '0.75rem',
                background: selectedStore?.id === store.id ? '#eff6ff' : '#f9fafb',
                border: selectedStore?.id === store.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
              onClick={() => focusStore(store)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.125rem' }}>
                    {store.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {store.address}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {store.hasOrganic && (
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Orgánicos</span>
                    )}
                    {store.hasLocal && (
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Locales</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6' }}>
                    {store.distance} km
                  </div>
                </div>
              </div>

              {selectedStore?.id === store.id && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                  {/* Open/Closed status */}
                  {store.is_open !== null && store.is_open !== undefined && (
                    <div style={{
                      marginBottom: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: store.is_open ? '#10b981' : '#ef4444'
                    }}>
                      {store.is_open ? '● Abierto ahora' : '● Cerrado'}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem', fontSize: '0.7rem', color: '#6b7280' }}>
                    {store.hours && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={10} />
                        {store.hours}
                      </span>
                    )}
                    {store.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={10} />
                        {store.phone}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInMaps(store);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    <Navigation size={14} />
                    Cómo llegar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
            No se encontraron tiendas con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
