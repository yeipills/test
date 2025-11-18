import { useState } from 'react';
import { Leaf, Search, ShoppingCart, BarChart3, TrendingUp, MapPin } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductSearch from './components/ProductSearch';
import ShoppingListOptimizer from './components/ShoppingListOptimizer';
import ProductComparator from './components/ProductComparator';
import StoreMap from './components/StoreMap';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'search':
        return <ProductSearch />;
      case 'optimizer':
        return <ShoppingListOptimizer />;
      case 'compare':
        return <ProductComparator />;
      case 'stores':
        return <StoreMap />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Leaf size={32} />
            <span>LiquiVerde</span>
          </div>

          <nav className="nav">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp size={16} />
              Dashboard
            </button>
            <button
              className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={16} />
              Productos
            </button>
            <button
              className={`nav-btn ${activeTab === 'optimizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('optimizer')}
            >
              <ShoppingCart size={16} />
              Optimizador
            </button>
            <button
              className={`nav-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              <BarChart3 size={16} />
              Comparar
            </button>
            <button
              className={`nav-btn ${activeTab === 'stores' ? 'active' : ''}`}
              onClick={() => setActiveTab('stores')}
            >
              <MapPin size={16} />
              Tiendas
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container">{renderContent()}</main>

      {/* Footer */}
      <footer style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          <strong>LiquiVerde Smart Retail Platform</strong>
          <span style={{ display: 'block', marginTop: '0.25rem' }}>Grupo Lagos</span>
        </div>
        <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
          Plataforma de compras inteligentes
        </div>
        <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.8 }}>
          Mochila Multi-objetivo | Scoring | Sustitución
        </div>
      </footer>
    </div>
  );
}

export default App;
