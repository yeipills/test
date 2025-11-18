import { useState, useEffect } from 'react';
import { recommendationsAPI, statsAPI } from '../services/api';
import { TrendingUp, Leaf, Award, DollarSign, ShoppingBag } from 'lucide-react';
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
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function Dashboard() {
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

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        Dashboard de Sostenibilidad
      </h1>

      {/* Stats Overview */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <ShoppingBag size={24} />
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Productos</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.total_products}</div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Award size={24} />
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Categorías</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.categories_count}</div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <DollarSign size={24} />
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Precio Promedio</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>${stats.average_price.toFixed(0)}</div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Leaf size={24} />
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Productos Locales</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.labels?.local || 0}</div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Categories Bar Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
              Productos por Categoria
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={Object.entries(stats.categories || {}).map(([name, count]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  productos: count,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Labels Pie Chart */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
              Caracteristicas de Productos
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.labels || {}).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                    value: value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats.labels || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Sustainability Scores Bar Chart */}
          {topSustainable.length > 0 && (
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                Scores de Sostenibilidad - Top Productos
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topSustainable.map((item) => ({
                    name: item.product.name.length > 15
                      ? item.product.name.substring(0, 15) + '...'
                      : item.product.name,
                    Economico: item.sustainability_score.economic_score || 0,
                    Ambiental: item.sustainability_score.environmental_score || 0,
                    Social: item.sustainability_score.social_score || 0,
                    Salud: item.sustainability_score.health_score || 0,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Economico" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Ambiental" stackId="a" fill="#10b981" />
                  <Bar dataKey="Social" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Salud" stackId="a" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Top Sustainable Products */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <Leaf size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#10b981' }} />
          Top 5 Productos Mas Sostenibles
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {topSustainable.map((item, index) => (
            <div
              key={item.product.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: index === 0 ? '#f0fdf4' : '#f9fafb',
                borderRadius: '0.5rem',
                border: index === 0 ? '2px solid #10b981' : '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: index === 0 ? '#10b981' : '#6b7280',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  marginRight: '1rem',
                }}
              >
                {index + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{item.product.name}</div>
                {item.product.brand && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{item.product.brand}</div>
                )}
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="badge badge-success">
                    Score: {item.sustainability_score.overall_score.toFixed(0)}/100
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                  ${item.product.price}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.product.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Value Products */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <TrendingUp size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#f59e0b' }} />
          Mejor Relación Calidad-Precio
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {bestValue.map((item) => (
            <div
              key={item.product.id}
              style={{
                padding: '1rem',
                background: '#fff7ed',
                borderRadius: '0.5rem',
                border: '1px solid #fed7aa',
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                {item.product.name}
              </div>
              {item.product.brand && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  {item.product.brand}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f59e0b' }}>
                  ${item.product.price}
                </div>
                <div className="badge badge-warning">
                  Value: {item.value_score.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Savings Opportunities */}
      <div className="card">
        <h2 className="card-title">
          <DollarSign size={20} style={{ display: 'inline', marginRight: '0.5rem', color: '#10b981' }} />
          Oportunidades de Ahorro
        </h2>

        {savingsOps.length > 0 ? (
          <>
            <div
              style={{
                padding: '1rem',
                background: '#f0fdf4',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #a7f3d0',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.25rem' }}>
                Potencial de Ahorro Total
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                ${savingsOps.reduce((sum, op) => sum + op.savings, 0).toFixed(0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>
                En {savingsOps.length} oportunidad(es) identificada(s)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {savingsOps.slice(0, 5).map((opportunity, index) => (
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
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        En lugar de:
                      </div>
                      <div style={{ fontWeight: '600' }}>{opportunity.expensive_product.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                        ${opportunity.expensive_product.price}
                      </div>
                    </div>

                    <div style={{ fontSize: '2rem', color: '#d1d5db', alignSelf: 'center' }}>→</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Mejor opción:
                      </div>
                      <div style={{ fontWeight: '600' }}>{opportunity.better_alternative.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#10b981' }}>
                        ${opportunity.better_alternative.price}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                        -${opportunity.savings.toFixed(0)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#059669' }}>
                        ({opportunity.savings_percentage.toFixed(0)}% ahorro)
                      </div>
                    </div>
                  </div>

                  {opportunity.sustainability_improvement > 0 && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: '#f0fdf4',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#065f46',
                      }}
                    >
                      Bonus: +{opportunity.sustainability_improvement.toFixed(0)} puntos de sostenibilidad
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            No hay oportunidades de ahorro significativas en este momento
          </div>
        )}
      </div>
    </div>
  );
}
