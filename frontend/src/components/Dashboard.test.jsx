import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock the API modules
vi.mock('../services/api', () => ({
  statsAPI: {
    getStats: vi.fn().mockResolvedValue({
      data: {
        total_products: 20,
        categories_count: 10,
        average_price: 2500,
        categories: { dairy: 3, bread: 2 },
        labels: { organic: 5, local: 8 },
      },
    }),
  },
  recommendationsAPI: {
    getTopSustainable: vi.fn().mockResolvedValue({
      data: {
        products: [
          {
            product: { id: '1', name: 'Quinoa', brand: 'Test', category: 'grains', price: 3990 },
            sustainability_score: {
              overall_score: 85,
              economic_score: 70,
              environmental_score: 95,
              social_score: 80,
              health_score: 90,
            },
          },
        ],
      },
    }),
    getBestValue: vi.fn().mockResolvedValue({
      data: {
        products: [
          {
            product: { id: '2', name: 'Arroz', brand: 'Test', category: 'grains', price: 1500 },
            value_score: 88,
          },
        ],
      },
    }),
    getSavingsOpportunities: vi.fn().mockResolvedValue({
      data: {
        opportunities: [
          {
            expensive_product: { id: '3', name: 'Leche Premium', price: 2500 },
            better_alternative: { id: '4', name: 'Leche Normal', price: 1500 },
            savings: 1000,
            savings_percentage: 40,
            sustainability_improvement: 5,
          },
        ],
      },
    }),
  },
}));

// Mock Navigation hook
vi.mock('../App', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
    navigationData: null,
    clearNavigationData: vi.fn()
  })
}));

describe('Dashboard Component', () => {
  it('renders loading state initially', () => {
    render(<Dashboard />);
    const spinner = document.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders dashboard title after loading', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard de Sostenibilidad')).toBeInTheDocument();
    });
  });

  it('displays total products stat', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('displays categories count', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Categorías')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('displays average price', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Precio Prom.')).toBeInTheDocument();
    });
  });

  it('displays local products count', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Locales')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  it('renders savings section with total', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Ahorra Ahora')).toBeInTheDocument();
      expect(screen.getByText('$1000 disponible')).toBeInTheDocument();
    });
  });

  it('renders top sustainable products section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Top Sostenibles')).toBeInTheDocument();
    });
  });

  it('renders best value section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Mejor Valor')).toBeInTheDocument();
    });
  });

  it('renders charts section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Por Categoría')).toBeInTheDocument();
      expect(screen.getByText('Características')).toBeInTheDocument();
    });
  });
});
