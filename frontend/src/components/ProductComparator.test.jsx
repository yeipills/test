import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductComparator from './ProductComparator';

// Mock the API modules
vi.mock('../services/api', () => ({
  productsAPI: {
    getAll: vi.fn().mockResolvedValue({
      data: {
        products: [
          { id: '1', name: 'Product 1', category: 'dairy', price: 1000 },
          { id: '2', name: 'Product 2', category: 'bread', price: 2000 },
        ]
      }
    }),
    compare: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock Toast hook
vi.mock('./Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}));

// Mock Navigation hook
vi.mock('../App', () => ({
  useNavigation: () => ({
    navigateTo: vi.fn(),
    navigationData: null,
    clearNavigationData: vi.fn()
  })
}));

describe('ProductComparator Component', () => {
  it('renders comparator title', () => {
    render(<ProductComparator />);
    expect(screen.getByText('Comparador de Productos')).toBeInTheDocument();
  });

  it('shows products selected count', () => {
    render(<ProductComparator />);
    expect(screen.getByText(/Productos Seleccionados/)).toBeInTheDocument();
  });

  it('shows product selection info', () => {
    render(<ProductComparator />);
    expect(screen.getByText(/Selecciona productos/i)).toBeInTheDocument();
  });

  it('renders product selection section', () => {
    render(<ProductComparator />);
    expect(screen.getByText('Seleccionar Productos')).toBeInTheDocument();
  });
});
