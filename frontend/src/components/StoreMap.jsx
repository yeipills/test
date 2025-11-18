import { useState, useEffect } from 'react';
import { MapPin, Navigation, Store, Clock, Phone } from 'lucide-react';

// Mock stores data - In production this would come from the API
const MOCK_STORES = [
  {
    id: 1,
    name: 'Jumbo Kennedy',
    address: 'Av. Kennedy 9001, Las Condes',
    lat: -33.3997,
    lng: -70.5783,
    hours: '8:00 - 22:00',
    phone: '+56 2 2200 1000',
    distance: 1.2,
    hasOrganic: true,
    hasLocal: true,
  },
  {
    id: 2,
    name: 'Lider Providencia',
    address: 'Av. Providencia 2124, Providencia',
    lat: -33.4255,
    lng: -70.6104,
    hours: '8:00 - 23:00',
    phone: '+56 2 2200 2000',
    distance: 2.5,
    hasOrganic: true,
    hasLocal: false,
  },
  {
    id: 3,
    name: 'Santa Isabel Vitacura',
    address: 'Av. Vitacura 3520, Vitacura',
    lat: -33.3922,
    lng: -70.5973,
    hours: '8:00 - 21:00',
    phone: '+56 2 2200 3000',
    distance: 3.1,
    hasOrganic: false,
    hasLocal: true,
  },
  {
    id: 4,
    name: 'Tottus Plaza Egana',
    address: 'Av. Larrain 5862, La Reina',
    lat: -33.4502,
    lng: -70.5655,
    hours: '9:00 - 22:00',
    phone: '+56 2 2200 4000',
    distance: 4.8,
    hasOrganic: true,
    hasLocal: true,
  },
  {
    id: 5,
    name: 'Unimarc Nunoa',
    address: 'Av. Irarrazaval 3450, Nunoa',
    lat: -33.4547,
    lng: -70.5997,
    hours: '8:30 - 21:30',
    phone: '+56 2 2200 5000',
    distance: 5.2,
    hasOrganic: false,
    hasLocal: true,
  },
];

export default function StoreMap() {
  const [stores, setStores] = useState(MOCK_STORES);
  const [selectedStore, setSelectedStore] = useState(null);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterLocal, setFilterLocal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter stores
  const filteredStores = stores.filter((store) => {
    if (filterOrganic && !store.hasOrganic) return false;
    if (filterLocal && !store.hasLocal) return false;
    return true;
  });

  // Get user location
  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
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

  // Open in Google Maps
  const openInMaps = (store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    window.open(url, '_blank');
  };

  // Open OpenStreetMap view
  const openOSMView = (store) => {
    const url = `https://www.openstreetmap.org/?mlat=${store.lat}&mlon=${store.lng}#map=17/${store.lat}/${store.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        Mapa de Tiendas Cercanas
      </h1>

      {/* Filters and Location */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="store-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={getUserLocation}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: userLocation ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: '500',
            }}
          >
            <Navigation size={18} />
            {loading ? 'Obteniendo ubicacion...' : userLocation ? 'Ubicacion obtenida' : 'Usar mi ubicacion'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterOrganic}
              onChange={(e) => setFilterOrganic(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>Productos organicos</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterLocal}
              onChange={(e) => setFilterLocal(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>Productos locales</span>
          </label>
        </div>
      </div>

      {/* Map Placeholder with OpenStreetMap Link */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            height: '300px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <MapPin size={48} style={{ color: '#0284c7', marginBottom: '1rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
            Vista de Mapa
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0284c7', marginBottom: '1rem', textAlign: 'center', padding: '0 1rem' }}>
            {filteredStores.length} tiendas encontradas en tu zona
          </div>
          <a
            href={`https://www.openstreetmap.org/#map=13/-33.4489/-70.6693`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0284c7',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <MapPin size={18} />
            Ver en OpenStreetMap
          </a>
        </div>
      </div>

      {/* Store List */}
      <div className="card">
        <h2 className="card-title">
          <Store size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#3b82f6' }} />
          Tiendas Disponibles ({filteredStores.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStores.map((store) => (
            <div
              key={store.id}
              style={{
                padding: '1rem',
                background: selectedStore?.id === store.id ? '#eff6ff' : '#f9fafb',
                border: selectedStore?.id === store.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setSelectedStore(store)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {store.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {store.address}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {store.hasOrganic && (
                      <span className="badge badge-success">Organicos</span>
                    )}
                    {store.hasLocal && (
                      <span className="badge badge-info">Locales</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {store.hours}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Phone size={12} />
                      {store.phone}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                    {store.distance} km
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>distancia</div>
                </div>
              </div>

              {selectedStore?.id === store.id && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInMaps(store);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Navigation size={16} />
                      Como llegar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openOSMView(store);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <MapPin size={16} />
                      Ver en mapa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No se encontraron tiendas con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  );
}
