import { useState, createContext, useContext } from 'react';
import { Leaf, Search, ShoppingCart, BarChart3, TrendingUp, MapPin, Zap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductSearch from './components/ProductSearch';
import ShoppingListOptimizer from './components/ShoppingListOptimizer';
import ProductComparator from './components/ProductComparator';
import StoreMap from './components/StoreMap';
import { ToastProvider } from './components/Toast';
import './styles/App.css';

// Navigation Context for cross-component navigation
const NavigationContext = createContext(null);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

function App() {
  // Optimizador como página principal
  const [activeTab, setActiveTab] = useState('optimizer');
  const [navigationData, setNavigationData] = useState(null);

  // Navigate to a tab with optional data
  const navigateTo = (tab, data = null) => {
    setNavigationData(data);
    setActiveTab(tab);
  };

  // Clear navigation data after consumption
  const clearNavigationData = () => {
    setNavigationData(null);
  };

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
    <ToastProvider>
      <NavigationContext.Provider value={{ navigateTo, navigationData, clearNavigationData, activeTab }}>
        <div className="app">
          {/* Header */}
          <header className="header">
            <div className="header-content">
              <div className="logo" onClick={() => navigateTo('optimizer')} style={{ cursor: 'pointer' }}>
                <Leaf size={32} />
                <span>LiquiVerde</span>
              </div>

              <nav className="nav">
                {/* Optimizador destacado como principal */}
                <button
                  className={`nav-btn nav-btn-primary ${activeTab === 'optimizer' ? 'active' : ''}`}
                  onClick={() => navigateTo('optimizer')}
                >
                  <Zap size={16} />
                  Optimizar
                </button>

                {/* Flujo: Buscar → Comparar → Ver stats → Tiendas */}
                <button
                  className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => navigateTo('search')}
                >
                  <Search size={16} />
                  Productos
                </button>
                <button
                  className={`nav-btn ${activeTab === 'compare' ? 'active' : ''}`}
                  onClick={() => navigateTo('compare')}
                >
                  <BarChart3 size={16} />
                  Comparar
                </button>
                <button
                  className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => navigateTo('dashboard')}
                >
                  <TrendingUp size={16} />
                  Stats
                </button>
                <button
                  className={`nav-btn ${activeTab === 'stores' ? 'active' : ''}`}
                  onClick={() => navigateTo('stores')}
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
      </NavigationContext.Provider>
    </ToastProvider>
  );
}

export default App;
