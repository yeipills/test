import { useState, useEffect } from 'react';
import { productsAPI, recommendationsAPI } from '../services/api';
import { Plus, X, BarChart3, Zap, ShoppingCart, MapPin } from 'lucide-react';
import { useToast } from './Toast';
import { useNavigation } from '../App';

export default function ProductComparator() {
  const toast = useToast();
  const { navigateTo, navigationData, clearNavigationData } = useNavigation();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  // Handle navigation data (product IDs from optimizer)
  useEffect(() => {
    if (navigationData && navigationData.productIds && products.length > 0) {
      const productsToSelect = products.filter(p =>
        navigationData.productIds.includes(p.id)
      );
      if (productsToSelect.length > 0) {
        setSelectedProducts(productsToSelect);
        toast.info(`${productsToSelect.length} productos cargados para comparar`);
      }
      clearNavigationData();
    }
  }, [navigationData, products, clearNavigationData]);

  const loadProducts = async () => {
    try {
      const { data } = await productsAPI.getAll();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProduct = (product) => {
    if (selectedProducts.find((p) => p.id === product.id)) {
      toast.warning('Este producto ya está seleccionado');
      return;
    }

    if (selectedProducts.length >= 4) {
      toast.warning('Máximo 4 productos para comparar');
      return;
    }

    setSelectedProducts([...selectedProducts, product]);
    setComparison(null);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
    setComparison(null);
  };

  const handleCompare = async () => {
    if (selectedProducts.length < 2) {
      toast.warning('Selecciona al menos 2 productos para comparar');
      return;
    }

    try {
      const productIds = selectedProducts.map((p) => p.id);
      const { data } = await productsAPI.compare(productIds);
      setComparison(data);
      toast.success('Comparación completada');
    } catch (error) {
      console.error('Error comparing:', error);
      toast.error('Error al comparar productos');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSustainabilityColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        Comparador de Productos
      </h1>

      {/* Selected Products */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">Productos Seleccionados ({selectedProducts.length}/4)</h2>

        {selectedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Selecciona productos de la lista abajo para comparar
          </div>
        ) : (
          <>
            <div className="wide-grid-4" style={{ marginBottom: '1rem' }}>
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => removeProduct(product.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                  </button>

                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{product.name}</div>
                  {product.brand && (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {product.brand}
                    </div>
                  )}
                  <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                    ${product.price}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCompare}
              style={{ width: '100%' }}
            >
              <BarChart3 size={16} />
              Comparar Productos
            </button>
          </>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title">Resultado de la Comparación</h2>

          {/* Winners */}
          <div className="wide-grid-3" style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem', fontWeight: '600' }}>
                Mejor Precio
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                {comparison.best_price.name}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
                ${comparison.best_price.price}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem', fontWeight: '600' }}>
                Más Sostenible
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                {comparison.best_sustainability.name}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '2px solid #10b981' }}>
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.5rem', fontWeight: '600' }}>
                Más Saludable
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                {comparison.best_health.name}
              </div>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
                    Criterio
                  </th>
                  {comparison.products.map((item) => (
                    <th
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}
                    >
                      {item.product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                    Precio
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: '700',
                        color: item.product.id === comparison.best_price.id ? '#10b981' : '#111827',
                      }}
                    >
                      ${item.product.price}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                    Sostenibilidad General
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      <div
                        style={{
                          fontWeight: '600',
                          color: getSustainabilityColor(item.sustainability.overall_score),
                        }}
                      >
                        {item.sustainability.overall_score.toFixed(0)}/100
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ background: '#fafafa' }}>
                  <td style={{ padding: '0.75rem', paddingLeft: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    Score Económico
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {item.sustainability.economic_score.toFixed(0)}
                    </td>
                  ))}
                </tr>

                <tr style={{ background: '#fafafa' }}>
                  <td style={{ padding: '0.75rem', paddingLeft: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    Score Ambiental
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {item.sustainability.environmental_score.toFixed(0)}
                    </td>
                  ))}
                </tr>

                <tr style={{ background: '#fafafa' }}>
                  <td style={{ padding: '0.75rem', paddingLeft: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    Score Social
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {item.sustainability.social_score.toFixed(0)}
                    </td>
                  ))}
                </tr>

                <tr style={{ background: '#fafafa' }}>
                  <td style={{ padding: '0.75rem', paddingLeft: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                    Score Salud
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {item.sustainability.health_score.toFixed(0)}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                    Impacto Ambiental
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      <span
                        className={`badge badge-${
                          item.environmental_impact === 'low'
                            ? 'success'
                            : item.environmental_impact === 'medium'
                            ? 'warning'
                            : 'error'
                        }`}
                      >
                        {item.environmental_impact}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.75rem', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                    Calificación Salud
                  </td>
                  {comparison.products.map((item) => (
                    <td
                      key={item.product.id}
                      style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {item.health_rating}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Selection */}
      <div className="card">
        <h2 className="card-title">Seleccionar Productos</h2>

        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="wide-grid-4">
          {filteredProducts.slice(0, 16).map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => addProduct(product)}
              style={{
                opacity: selectedProducts.find((p) => p.id === product.id) ? 0.5 : 1,
                cursor: selectedProducts.find((p) => p.id === product.id) ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="product-header">
                <div>
                  <div className="product-name">{product.name}</div>
                  {product.brand && <div className="product-brand">{product.brand}</div>}
                </div>
                <div className="product-price">${product.price}</div>
              </div>

              <div className="product-category">{product.category}</div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.875rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  addProduct(product);
                }}
                disabled={selectedProducts.find((p) => p.id === product.id)}
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
