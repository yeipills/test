import { useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../services/api';
import { Search, Barcode, Leaf, MapPin, Navigation, Store, Clock, Phone, AlertCircle } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useToast } from './Toast';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '0.5rem',
};

const center = {
  lat: -33.4489,
  lng: -70.6693,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function ProductSearch() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // Map state
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [map, setMap] = useState(null);
  const [infoWindowStore, setInfoWindowStore] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const hasApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  // Fetch stores when user location changes
  useEffect(() => {
    const fetchStores = async () => {
      if (!userLocation) return;

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
      }
    };

    fetchStores();
  }, [userLocation]);

  const loadCategories = async () => {
    try {
      const { data } = await productsAPI.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getAll();
      const prods = data.products || [];
      setAllProducts(prods);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (value) => {
    setSearchQuery(value);
    filterProducts(value, selectedCategory);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    filterProducts(searchQuery, value);
  };

  const filterProducts = (query, category) => {
    let filtered = allProducts;

    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    setProducts(filtered);
  };

  const handleBarcodeSearch = async () => {
    if (!barcode) {
      toast.warning('Ingresa un código de barras');
      return;
    }

    if (!/^\d+$/.test(barcode)) {
      toast.warning('El código de barras debe contener solo números');
      return;
    }

    try {
      setLoading(true);
      const { data } = await productsAPI.getByBarcode(barcode, true);
      setProducts([data.product]);
      toast.success('Producto encontrado');
    } catch (error) {
      toast.error('Producto no encontrado con ese código de barras');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    try {
      const { data } = await productsAPI.analyze(product.id);
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing product:', error);
    }
  };

  const getSustainabilityColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Map functions
  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getUserLocation = () => {
    setLoadingLocation(true);
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
          setLoadingLocation(false);
          toast.success('Ubicación obtenida');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('No se pudo obtener la ubicación');
          setLoadingLocation(false);
        }
      );
    } else {
      toast.error('Geolocalización no soportada');
      setLoadingLocation(false);
    }
  };

  const openInMaps = (store) => {
    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : '';
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${store.lat},${store.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
        Productos y Tiendas
      </h1>

      {/* Search Bar - Full Width */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">Todas</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Código de barras..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
              style={{ width: '150px' }}
            />
            <button className="btn btn-primary" onClick={handleBarcodeSearch} style={{ padding: '0.5rem 0.75rem' }}>
              <Barcode size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 300px',
        gap: '1rem',
        alignItems: 'start'
      }}>
        {/* Products Column 1 */}
        <div className="card" style={{ marginBottom: 0, padding: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Productos ({products.filter((_, i) => i % 2 === 0).length})
          </h3>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {products.filter((_, i) => i % 2 === 0).map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                  style={{ marginBottom: 0 }}
                >
                  <div className="product-header">
                    <div>
                      <div className="product-name">{product.name}</div>
                      {product.brand && <div className="product-brand">{product.brand}</div>}
                    </div>
                    <div className="product-price">${product.price}</div>
                  </div>
                  <div className="product-category">{product.category}</div>
                  {product.labels && product.labels.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {product.labels.slice(0, 2).map((label) => (
                        <span key={label} className="badge badge-info" style={{ fontSize: '0.6rem' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products Column 2 */}
        <div className="card" style={{ marginBottom: 0, padding: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
            Continuación
          </h3>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {products.filter((_, i) => i % 2 === 1).map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => handleProductClick(product)}
                  style={{ marginBottom: 0 }}
                >
                  <div className="product-header">
                    <div>
                      <div className="product-name">{product.name}</div>
                      {product.brand && <div className="product-brand">{product.brand}</div>}
                    </div>
                    <div className="product-price">${product.price}</div>
                  </div>
                  <div className="product-category">{product.category}</div>
                  {product.labels && product.labels.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {product.labels.slice(0, 2).map((label) => (
                        <span key={label} className="badge badge-info" style={{ fontSize: '0.6rem' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {products.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
              No se encontraron productos
            </div>
          )}
        </div>

        {/* Map Column 3 */}
        <div className="card" style={{ marginBottom: 0, padding: '0.75rem', position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} />
              Tiendas Cercanas
            </h2>
            <button
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="btn"
              style={{
                background: userLocation ? '#10b981' : '#3b82f6',
                color: 'white',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem'
              }}
            >
              <Navigation size={12} />
              {loadingLocation ? '...' : userLocation ? 'OK' : 'Ubicación'}
            </button>
          </div>

          {!hasApiKey ? (
            <div style={{
              height: '250px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.5rem',
              padding: '1rem',
            }}>
              <AlertCircle size={32} style={{ color: '#d97706', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#92400e', textAlign: 'center' }}>
                Configura VITE_GOOGLE_MAPS_API_KEY
              </div>
            </div>
          ) : !isLoaded ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ height: '250px', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={userLocation || center}
                zoom={userLocation ? 14 : 12}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                options={mapOptions}
              >
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

                {stores.map((store) => (
                  <Marker
                    key={store.id}
                    position={{ lat: store.lat, lng: store.lng }}
                    onClick={() => setInfoWindowStore(store)}
                  />
                ))}

                {infoWindowStore && (
                  <InfoWindow
                    position={{ lat: infoWindowStore.lat, lng: infoWindowStore.lng }}
                    onCloseClick={() => setInfoWindowStore(null)}
                  >
                    <div style={{ padding: '0.25rem', maxWidth: '180px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        {infoWindowStore.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {infoWindowStore.distance} km
                      </div>
                      <button
                        onClick={() => openInMaps(infoWindowStore)}
                        style={{
                          width: '100%',
                          padding: '0.3rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cómo llegar
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          )}

          {/* Store List */}
          {stores.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Tiendas ({stores.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '200px', overflowY: 'auto' }}>
                {stores.slice(0, 5).map((store) => (
                  <div
                    key={store.id}
                    style={{
                      padding: '0.5rem',
                      background: '#f9fafb',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb',
                      transition: 'border-color 0.2s'
                    }}
                    onClick={() => {
                      if (map) {
                        map.panTo({ lat: store.lat, lng: store.lng });
                        map.setZoom(16);
                      }
                      setInfoWindowStore(store);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500' }}>{store.name}</span>
                      <span style={{ color: '#3b82f6', fontWeight: '600' }}>{store.distance} km</span>
                    </div>
                    {store.is_open !== null && store.is_open !== undefined && (
                      <div style={{ fontSize: '0.65rem', color: store.is_open ? '#10b981' : '#ef4444' }}>
                        {store.is_open ? '● Abierto' : '● Cerrado'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!userLocation && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
              Haz clic en "Ubicación" para ver tiendas cercanas
            </div>
          )}
        </div>
      </div>

      {/* Product Analysis Modal */}
      {selectedProduct && analysis && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => {
            setSelectedProduct(null);
            setAnalysis(null);
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="card-title">{selectedProduct.name}</h2>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                ${selectedProduct.price}
              </div>
              {selectedProduct.brand && (
                <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>{selectedProduct.brand}</div>
              )}
              {selectedProduct.store && (
                <div style={{ color: '#6b7280', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Store size={14} />
                  {selectedProduct.store}
                </div>
              )}
            </div>

            {/* Sustainability Scores */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Puntuación de Sostenibilidad
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Económico', value: analysis.sustainability.economic_score },
                  { label: 'Ambiental', value: analysis.sustainability.environmental_score },
                  { label: 'Social', value: analysis.sustainability.social_score },
                  { label: 'Salud', value: analysis.sustainability.health_score },
                ].map((score) => (
                  <div key={score.label}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{score.label}</div>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${score.value}%`,
                          background: getSustainabilityColor(score.value),
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '0.25rem' }}>{score.value.toFixed(0)}/100</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>
                Recomendación
              </div>
              <div style={{ color: '#047857', fontSize: '0.9rem' }}>{analysis.recommendation}</div>
            </div>

            {/* Savings Potential */}
            {analysis.savings_potential > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  Potencial de ahorro
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>
                  ${analysis.savings_potential.toFixed(0)}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {analysis.alternatives && analysis.alternatives.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Alternativas Similares
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analysis.alternatives.slice(0, 3).map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500' }}>{alt.name}</div>
                        {alt.brand && <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{alt.brand}</div>}
                      </div>
                      <div style={{ fontWeight: '600', color: '#10b981' }}>${alt.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => {
                setSelectedProduct(null);
                setAnalysis(null);
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
