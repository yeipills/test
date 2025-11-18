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
      data: { products: [] },
    }),
    getSavingsOpportunities: vi.fn().mockResolvedValue({
      data: { opportunities: [] },
    }),
  },
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
      expect(screen.getByText('Total Productos')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('displays categories count', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Categorías')).toBeInTheDocument();
    });
  });

  it('displays average price', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Precio Promedio')).toBeInTheDocument();
    });
  });

  it('displays local products count', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Productos Locales')).toBeInTheDocument();
    });
  });

  it('renders top sustainable products section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Top 5 Productos/)).toBeInTheDocument();
    });
  });

  it('renders best value section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Mejor Relación Calidad-Precio/)).toBeInTheDocument();
    });
  });

  it('renders savings opportunities section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Oportunidades de Ahorro/)).toBeInTheDocument();
    });
  });

  it('renders charts section', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Productos por Categoria')).toBeInTheDocument();
      expect(screen.getByText('Caracteristicas de Productos')).toBeInTheDocument();
    });
  });
});
