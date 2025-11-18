import { useState, useEffect } from 'react';
import { recommendationsAPI, statsAPI } from '../services/api';
import { TrendingUp, Leaf, Award, DollarSign, ShoppingBag, ArrowRight, Zap } from 'lucide-react';
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

  const totalSavings = savingsOps.reduce((sum, op) => sum + op.savings, 0);

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
        Dashboard de Sostenibilidad
      </h1>

      {/* Stats Overview - Compact */}
      {stats && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '0.875rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShoppingBag size={16} />
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Productos</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats.total_products}</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '0.875rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Award size={16} />
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Categorías</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats.categories_count}</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '0.875rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <DollarSign size={16} />
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Precio Prom.</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>${stats.average_price.toFixed(0)}</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', padding: '0.875rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Leaf size={16} />
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Locales</div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stats.labels?.local || 0}</div>
          </div>
        </div>
      )}

      {/* PRIORITY: Savings Opportunities - Most Actionable */}
      {savingsOps.length > 0 && (
        <div className="card highlight-card" style={{ marginBottom: '1rem', border: '2px solid #10b981', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} style={{ color: '#10b981' }} />
              Ahorra Ahora
            </h2>
            <div style={{ background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: '700', fontSize: '1.1rem' }}>
              ${totalSavings.toFixed(0)} disponible
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {savingsOps.slice(0, 3).map((opportunity, index) => (
              <div
                key={index}
                className="savings-item"
                style={{
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid #a7f3d0',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.125rem' }}>Cambiar</div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opportunity.expensive_product.name}
                  </div>
                </div>

                <ArrowRight size={16} style={{ color: '#10b981', flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.125rem' }}>Por</div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {opportunity.better_alternative.name}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
                    -${opportunity.savings.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#059669' }}>
                    {opportunity.savings_percentage.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {savingsOps.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: '#059669' }}>
              +{savingsOps.length - 3} oportunidades más
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout for Lists */}
      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {/* Top Sustainable - Compact */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Leaf size={18} style={{ color: '#10b981' }} />
            Top Sostenibles
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {topSustainable.slice(0, 3).map((item, index) => (
              <div
                key={item.product.id}
                className="product-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.625rem',
                  background: index === 0 ? '#f0fdf4' : '#f9fafb',
                  borderRadius: '0.375rem',
                  border: index === 0 ? '1px solid #10b981' : '1px solid #e5e7eb',
                  gap: '0.5rem',
                  transition: 'transform 0.2s',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: index === 0 ? '#10b981' : '#9ca3af',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    Score: {item.sustainability_score.overall_score.toFixed(0)}
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981', flexShrink: 0 }}>
                  ${item.product.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Value - Compact */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: '#f59e0b' }} />
            Mejor Valor
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {bestValue.slice(0, 3).map((item, index) => (
              <div
                key={item.product.id}
                className="product-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.625rem',
                  background: '#fffbeb',
                  borderRadius: '0.375rem',
                  border: '1px solid #fde68a',
                  gap: '0.5rem',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    {item.product.brand || item.product.category}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f59e0b' }}>
                    ${item.product.price}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#92400e' }}>
                    Val: {item.value_score.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts - Lower Priority */}
      {stats && (
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Categories Bar Chart */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
              Por Categoría
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={Object.entries(stats.categories || {}).map(([name, count]) => ({
                  name: name.substring(0, 6),
                  qty: count,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Labels Pie Chart */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
              Características
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.labels || {}).map(([name, value]) => ({
                    name: name.substring(0, 8),
                    value: value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
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
        </div>
      )}
    </div>
  );
}
