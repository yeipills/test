import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { Search, Barcode, Leaf, TrendingUp, Heart } from 'lucide-react';

export default function ProductSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

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
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (selectedCategory) params.category = selectedCategory;

      const { data } = await productsAPI.search(params);
      setProducts(data.results || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcode) return;

    try {
      setLoading(true);
      const { data } = await productsAPI.getByBarcode(barcode, true);
      setProducts([data.product]);
    } catch (error) {
      alert('Producto no encontrado con ese código de barras');
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

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Buscar Productos</h2>

        {/* Search by Name */}
        <div className="form-group">
          <label className="form-label">
            <Search size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Buscar por nombre
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: leche, pan, arroz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleSearch}>
              Buscar
            </button>
          </div>
        </div>

        {/* Search by Barcode */}
        <div className="form-group">
          <label className="form-label">
            <Barcode size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Escanear código de barras
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ingrese código de barras..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
            />
            <button className="btn btn-primary" onClick={handleBarcodeSearch}>
              Escanear
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product)}
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
                  {product.labels.slice(0, 3).map((label) => (
                    <span key={label} className="badge badge-info">
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {product.sustainability && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280' }}>Sostenibilidad</span>
                    <span
                      style={{
                        fontWeight: '600',
                        color: getSustainabilityColor(product.sustainability.overall_score),
                      }}
                    >
                      {product.sustainability.overall_score}/100
                    </span>
                  </div>
                  <div className="score-bar" style={{ marginTop: '0.25rem' }}>
                    <div
                      className="score-fill"
                      style={{
                        width: `${product.sustainability.overall_score}%`,
                        background: getSustainabilityColor(product.sustainability.overall_score),
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
            </div>

            {/* Sustainability Scores */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Puntuación de Sostenibilidad
              </h3>
              <div className="score-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Económico', value: analysis.sustainability.economic_score },
                  { label: 'Ambiental', value: analysis.sustainability.environmental_score },
                  { label: 'Social', value: analysis.sustainability.social_score },
                  { label: 'Salud', value: analysis.sustainability.health_score },
                ].map((score) => (
                  <div key={score.label} className="score-item">
                    <div className="score-label">{score.label}</div>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${score.value}%`,
                          background: getSustainabilityColor(score.value),
                        }}
                      ></div>
                    </div>
                    <div className="score-value">{score.value.toFixed(0)}/100</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="card" style={{ background: '#f0fdf4', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>
                Recomendación
              </div>
              <div style={{ color: '#047857' }}>{analysis.recommendation}</div>
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
