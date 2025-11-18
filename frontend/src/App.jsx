import { useState } from 'react';
import { Leaf, Search, ShoppingCart, BarChart3, TrendingUp, MapPin, Zap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductSearch from './components/ProductSearch';
import ShoppingListOptimizer from './components/ShoppingListOptimizer';
import ProductComparator from './components/ProductComparator';
import StoreMap from './components/StoreMap';
import './styles/App.css';

function App() {
  // Optimizador como página principal
  const [activeTab, setActiveTab] = useState('optimizer');

  const renderContent = () => {
    switch (activeTab) {
      case 'optimizer':
        return <ShoppingListOptimizer />;
      case 'search':
        return <ProductSearch />;
      case 'compare':
        return <ProductComparator />;
      case 'dashboard':
        return <Dashboard />;
      case 'stores':
        return <StoreMap />;
      default:
        return <ShoppingListOptimizer />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => setActiveTab('optimizer')} style={{ cursor: 'pointer' }}>
            <Leaf size={32} />
            <span>LiquiVerde</span>
          </div>

          <nav className="nav">
            {/* Optimizador destacado como principal */}
            <button
              className={`nav-btn nav-btn-primary ${activeTab === 'optimizer' ? 'active' : ''}`}
              onClick={() => setActiveTab('optimizer')}
            >
              <Zap size={16} />
              Optimizar
            </button>

            {/* Flujo: Buscar → Comparar → Ver stats → Tiendas */}
            <button
              className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={16} />
              Productos
            </button>
            <button
              className={`nav-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              <BarChart3 size={16} />
              Comparar
            </button>
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp size={16} />
              Stats
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

      {/* Footer simplificado */}
      <footer style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb',
        fontSize: '0.8rem'
      }}>
        <strong>LiquiVerde</strong> · Grupo Lagos ·
        <span style={{ opacity: 0.7 }}> Optimización inteligente de compras</span>
      </footer>
    </div>
  );
}

export default App;
