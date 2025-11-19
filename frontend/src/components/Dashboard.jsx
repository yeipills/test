import { useState, useEffect } from 'react';
import { recommendationsAPI, statsAPI } from '../services/api';
import { TrendingUp, Leaf, Award, DollarSign, ShoppingBag, ArrowRight, Zap, Search, ShoppingCart, Recycle, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
} from 'recharts';
import { useNavigation } from '../App';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function Dashboard() {
  const { navigateTo } = useNavigation();
  const [stats, setStats] = useState(null);
  const [topSustainable, setTopSustainable] = useState([]);
  const [bestValue, setBestValue] = useState([]);
  const [savingsOps, setSavingsOps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsRes, sustainableRes, valueRes, savingsRes] = await Promise.all([
        statsAPI.getStats(),
        recommendationsAPI.getTopSustainable(null, 5),
        recommendationsAPI.getBestValue(null, 5),
        recommendationsAPI.getSavingsOpportunities(15),
      ]);

      setStats(statsRes.data);
      setTopSustainable(sustainableRes.data.products || []);
      setBestValue(valueRes.data.products || []);
      setSavingsOps(savingsRes.data.opportunities || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalSavings = savingsOps.reduce((sum, op) => sum + op.savings, 0);

  // Calculate sustainability metrics
  const sustainabilityData = stats ? [
    { name: 'Locales', value: stats.labels?.local || 0, fill: '#3b82f6' },
    { name: 'Orgánicos', value: stats.labels?.organic || 0, fill: '#10b981' },
    { name: 'Reciclables', value: stats.labels?.recyclable || 0, fill: '#06b6d4' },
  ] : [];

  // Price distribution data
  const priceRanges = stats?.price_ranges || {
    'Bajo (<$2k)': Math.floor(stats?.total_products * 0.3) || 0,
    'Medio ($2k-$5k)': Math.floor(stats?.total_products * 0.45) || 0,
    'Alto (>$5k)': Math.floor(stats?.total_products * 0.25) || 0,
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
        Dashboard de Sostenibilidad
      </h1>

      {/* Empty State - No Data */}
      {!loading && !stats && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Search size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
            Bienvenido a LiquiVerde
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Comienza explorando productos o creando tu primera lista de compras optimizada
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigateTo('search')}>
              <Search size={16} />
              Explorar Productos
            </button>
            <button className="btn btn-outline" onClick={() => navigateTo('optimizer')}>
              <ShoppingCart size={16} />
              Crear Lista
            </button>
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Main Stats Grid - 6 columns on large screens */}
          <div className="stats-row" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShoppingBag size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Total Productos</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.total_products}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Award size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Categorías</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.categories_count}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <DollarSign size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Precio Promedio</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>${stats.average_price.toFixed(0)}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Leaf size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Productos Locales</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.labels?.local || 0}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Recycle size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Reciclables</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.labels?.recyclable || 0}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              color: 'white',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Target size={18} />
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Orgánicos</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.labels?.organic || 0}</div>
            </div>
          </div>

          {/* Charts Section - Two columns */}
          <div className="wide-grid-2" style={{ marginBottom: '1rem' }}>
            {/* Categories Distribution */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Distribución por Categoría
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={Object.entries(stats.categories || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([name, count]) => ({
                      name: name.length > 8 ? name.substring(0, 8) + '...' : name,
                      fullName: name,
                      cantidad: count,
                    }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip
                    formatter={(value, name) => [value, 'Productos']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="cantidad" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sustainability Breakdown */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Indicadores de Sostenibilidad
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={sustainabilityData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [value, 'Productos']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sustainabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Section - High Priority */}
          {savingsOps.length > 0 && (
            <div className="card" style={{
              marginBottom: '1rem',
              border: '2px solid #10b981',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Zap size={20} style={{ color: '#10b981' }} />
                  Oportunidades de Ahorro
                </h2>
                <div style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontWeight: '700',
                  fontSize: '1.1rem'
                }}>
                  ${totalSavings.toFixed(0)} disponible
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {savingsOps.slice(0, 4).map((opportunity, index) => (
                  <div
                    key={index}
                    onClick={() => navigateTo('search')}
                    style={{
                      padding: '0.75rem',
                      background: 'white',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.125rem' }}>Cambiar</div>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {opportunity.expensive_product.name}
                      </div>
                    </div>

                    <ArrowRight size={16} style={{ color: '#10b981', flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.125rem' }}>Por</div>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {opportunity.better_alternative.name}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
                        -${opportunity.savings.toFixed(0)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#059669' }}>
                        {opportunity.savings_percentage.toFixed(0)}% menos
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {savingsOps.length > 4 && (
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: '#059669' }}>
                  +{savingsOps.length - 4} oportunidades más
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={() => navigateTo('optimizer')}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                <ShoppingCart size={16} />
                Optimizar mi Lista
              </button>
            </div>
          )}

          {/* Product Rankings - Two columns */}
          <div className="wide-grid-2">
            {/* Top Sustainable */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Leaf size={18} style={{ color: '#10b981' }} />
                Top Sostenibles
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topSustainable.slice(0, 4).map((item, index) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.625rem',
                      background: index === 0 ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '0.375rem',
                      border: index === 0 ? '1px solid #10b981' : '1px solid #e5e7eb',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: index === 0 ? '#10b981' : index === 1 ? '#6b7280' : '#9ca3af',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                        Score: {item.sustainability_score.overall_score.toFixed(0)}/100
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981', flexShrink: 0 }}>
                      ${item.product.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Value */}
            <div className="card" style={{ marginBottom: 0 }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={18} style={{ color: '#f59e0b' }} />
                Mejor Relación Calidad-Precio
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {bestValue.slice(0, 4).map((item, index) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.625rem',
                      background: '#fffbeb',
                      borderRadius: '0.375rem',
                      border: '1px solid #fde68a',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                        {item.product.brand || item.product.category}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f59e0b' }}>
                        ${item.product.price}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#92400e' }}>
                        Valor: {item.value_score.toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
