import { useState, useEffect, useRef } from 'react';
import { shoppingListAPI, productsAPI } from '../services/api';
import { ShoppingCart, Plus, Trash2, Sparkles, DollarSign, Leaf, BarChart3, MapPin, Download, Store, Recycle, Heart, Award } from 'lucide-react';
import { useToast } from './Toast';
import { useNavigation } from '../App';

export default function ShoppingListOptimizer() {
  const toast = useToast();
  const { navigateTo } = useNavigation();
  const [items, setItems] = useState([]);
  const [budget, setBudget] = useState('');
  const [optimizeFor, setOptimizeFor] = useState('balanced');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [activeInput, setActiveInput] = useState(null);

  useEffect(() => {
    loadCategories();
    loadTemplates();
    loadAllProducts();
  }, []);

  const loadAllProducts = async () => {
    try {
      const { data } = await productsAPI.search({});
      setAllProducts(data.results || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await productsAPI.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data } = await shoppingListAPI.getTemplates();
      setTemplates(data.templates || {});
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_name: '',
        category: categories[0] || 'dairy',
        quantity: 1,
        priority: 1,
        preferences: [],
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

    // Show suggestions when typing product name
    if (field === 'product_name' && value.length >= 2) {
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions({ ...suggestions, [index]: filtered });
      setActiveInput(index);
    } else if (field === 'product_name') {
      setSuggestions({ ...suggestions, [index]: [] });
    }
  };

  const selectProduct = (index, product) => {
    const newItems = [...items];
    newItems[index].product_name = product.name;
    newItems[index].category = product.category;
    newItems[index].product_id = product.id;
    setItems(newItems);
    setSuggestions({ ...suggestions, [index]: [] });
    setActiveInput(null);
  };

  const closeSuggestions = () => {
    setSuggestions({});
    setActiveInput(null);
  };

  const loadTemplate = (templateKey) => {
    if (!templates || !templates[templateKey]) return;

    const template = templates[templateKey];
    setItems(template.items);
    setBudget(template.estimated_budget.toString());
  };

  const handleOptimize = async () => {
    if (items.length === 0) {
      toast.warning('Agrega al menos un item a la lista');
      return;
    }

    // Validate items have names
    const emptyItems = items.filter(item => !item.product_name.trim());
    if (emptyItems.length > 0) {
      toast.warning('Todos los items deben tener nombre');
      return;
    }

    try {
      setLoading(true);
      const shoppingList = {
        items: items,
        budget: budget ? parseFloat(budget) : null,
        optimize_for: optimizeFor,
      };

      const { data } = await shoppingListAPI.optimize(shoppingList);
      setResult(data);
      toast.success(`Lista optimizada! Ahorro: $${data.estimated_savings.toFixed(0)}`);
    } catch (error) {
      console.error('Error optimizing:', error);
      toast.error('Error al optimizar la lista');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to compare with selected products
  const handleCompareProducts = () => {
    if (result && result.optimized_items.length > 0) {
      const productIds = result.optimized_items
        .slice(0, 4)
        .map(item => item.selected_product.id);
      navigateTo('compare', { productIds });
    }
  };

  // Navigate to stores
  const handleViewStores = () => {
    navigateTo('stores');
  };

  const getSustainabilityColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`optimizer-layout ${result ? 'with-results' : ''}`}>
      <div className="card">
        <h2 className="card-title">
          <ShoppingCart size={24} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Lista de Compras
        </h2>

        {/* Templates */}
        {templates && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Templates rápidos</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.keys(templates).map((key) => (
                <button
                  key={key}
                  className="btn btn-outline"
                  onClick={() => loadTemplate(key)}
                  style={{ fontSize: '0.875rem' }}
                >
                  {templates[key].name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Presupuesto (CLP)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Ej: 20000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Optimizar para</label>
            <select
              className="form-select"
              value={optimizeFor}
              onChange={(e) => setOptimizeFor(e.target.value)}
            >
              <option value="balanced">Balanceado</option>
              <option value="price">Precio más bajo</option>
              <option value="sustainability">Sostenibilidad</option>
              <option value="health">Salud/Nutrición</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Items de la lista
            </label>
            <button className="btn btn-primary" onClick={addItem}>
              <Plus size={16} />
              Agregar Item
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              No hay items en la lista. Usa un template o agrega items manualmente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 0.5fr 0.5fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar producto..."
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      onBlur={() => setTimeout(closeSuggestions, 200)}
                      autoComplete="off"
                    />
                    {suggestions[index] && suggestions[index].length > 0 && activeInput === index && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}>
                        {suggestions[index].map((product) => (
                          <div
                            key={product.id}
                            onClick={() => selectProduct(index, product)}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{product.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{product.category}</span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>${product.price}</span>
                            </div>
                            {/* Store and labels */}
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {product.store && (
                                <span style={{ fontSize: '0.65rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                                  <Store size={10} />
                                  {product.store}
                                </span>
                              )}
                              {product.labels && product.labels.includes('organic') && (
                                <span style={{ fontSize: '0.6rem', background: '#d1fae5', color: '#065f46', padding: '0.1rem 0.3rem', borderRadius: '9999px' }}>
                                  Orgánico
                                </span>
                              )}
                              {product.sustainability?.local_product && (
                                <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1e40af', padding: '0.1rem 0.3rem', borderRadius: '9999px' }}>
                                  Local
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <select
                    className="form-select"
                    value={item.category}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="form-input"
                    placeholder="Cant."
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                  />

                  <select
                    className="form-select"
                    value={item.priority}
                    onChange={(e) => updateItem(index, 'priority', parseInt(e.target.value))}
                    title="Prioridad (1=esencial, 5=opcional)"
                  >
                    <option value="1">⭐⭐⭐⭐⭐</option>
                    <option value="2">⭐⭐⭐⭐</option>
                    <option value="3">⭐⭐⭐</option>
                    <option value="4">⭐⭐</option>
                    <option value="5">⭐</option>
                  </select>

                  <button
                    className="btn btn-outline"
                    onClick={() => removeItem(index)}
                    style={{ padding: '0.5rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOptimize}
          disabled={loading || items.length === 0}
          style={{ marginTop: '1.5rem', width: '100%' }}
        >
          <Sparkles size={16} />
          {loading ? 'Optimizando...' : 'Optimizar Lista de Compras'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card">
          <h2 className="card-title">Resultado de la Optimización</h2>

          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.25rem' }}>
                Costo Total
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
                ${result.total_cost.toFixed(0)}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.25rem' }}>
                Ahorro Estimado
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#d97706' }}>
                ${result.estimated_savings.toFixed(0)}
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '0.25rem' }}>
                Presupuesto Usado
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#2563eb' }}>
                {result.budget_used_percentage.toFixed(0)}%
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#f3e8ff', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#6b21a8', marginBottom: '0.25rem' }}>
                Score Sostenibilidad
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#9333ea' }}>
                {result.overall_sustainability.overall_score.toFixed(0)}/100
              </div>
            </div>
          </div>

          {/* Sustainability Breakdown */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Puntuaciones de Sostenibilidad
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Económico', value: result.overall_sustainability.economic_score },
                { label: 'Ambiental', value: result.overall_sustainability.environmental_score },
                { label: 'Social', value: result.overall_sustainability.social_score },
                { label: 'Salud', value: result.overall_sustainability.health_score },
              ].map((score) => (
                <div key={score.label}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {score.label}
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{
                        width: `${score.value}%`,
                        background: getSustainabilityColor(score.value),
                      }}
                    ></div>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', marginTop: '0.25rem' }}>
                    {score.value.toFixed(0)}/100
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Impact */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: '#065f46' }}>
              <Leaf size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Impacto Ambiental
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#047857' }}>Huella de Carbono</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#065f46' }}>
                  {result.total_carbon_footprint.toFixed(1)} kg CO₂
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#047857' }}>Uso de Agua</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#065f46' }}>
                  {result.total_water_usage.toFixed(0)} L
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#047857' }}>Reciclable</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#065f46' }}>
                  {result.recyclable_percentage.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Items */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
              Productos Seleccionados ({result.optimized_items.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.optimized_items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                        {item.selected_product.name}
                      </div>
                      {item.selected_product.brand && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {item.selected_product.brand}
                        </div>
                      )}
                      {/* Unit/quantity info */}
                      {item.selected_product.unit && item.selected_product.unit !== 'unit' && (
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {item.selected_product.quantity || 1} {item.selected_product.unit}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                        ${item.selected_product.price}
                      </div>
                      {item.savings > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                          Ahorras ${item.savings.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Store info */}
                  {item.selected_product.store && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#4b5563',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Store size={12} />
                      {item.selected_product.store}
                    </div>
                  )}

                  {/* Labels and sustainability indicators */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {item.selected_product.labels && item.selected_product.labels.map((label, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.65rem',
                          background: label.toLowerCase().includes('organic') ? '#d1fae5' : '#f3f4f6',
                          color: label.toLowerCase().includes('organic') ? '#065f46' : '#4b5563',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        {label.toLowerCase().includes('organic') && <Leaf size={10} />}
                        {label}
                      </span>
                    ))}
                    {item.selected_product.sustainability?.local_product && (
                      <span style={{
                        fontSize: '0.65rem',
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        <MapPin size={10} />
                        Local
                      </span>
                    )}
                    {item.selected_product.sustainability?.packaging_recyclable && (
                      <span style={{
                        fontSize: '0.65rem',
                        background: '#d1fae5',
                        color: '#065f46',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        <Recycle size={10} />
                        Reciclable
                      </span>
                    )}
                    {item.selected_product.sustainability?.fair_trade && (
                      <span style={{
                        fontSize: '0.65rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        <Award size={10} />
                        Comercio Justo
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {item.reason}
                  </div>

                  {item.alternatives.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      +{item.alternatives.length} alternativa(s) disponible(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Stores */}
          {result.recommended_stores && result.recommended_stores.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Tiendas Recomendadas
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {result.recommended_stores.map((store) => (
                  <span key={store} className="badge badge-info" style={{ padding: '0.5rem 1rem' }}>
                    {store}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Cross Navigation */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <button
              className="btn btn-primary"
              onClick={handleCompareProducts}
              style={{ flex: '1', minWidth: '150px' }}
            >
              <BarChart3 size={16} />
              Comparar Productos
            </button>
            <button
              className="btn btn-outline"
              onClick={handleViewStores}
              style={{ flex: '1', minWidth: '150px' }}
            >
              <MapPin size={16} />
              Ver en Tiendas
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                // Simple export to clipboard
                const text = result.optimized_items
                  .map(item => `${item.selected_product.name} - $${item.selected_product.price}`)
                  .join('\n');
                navigator.clipboard.writeText(text);
                toast.success('Lista copiada al portapapeles');
              }}
              style={{ flex: '1', minWidth: '150px' }}
            >
              <Download size={16} />
              Exportar Lista
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
