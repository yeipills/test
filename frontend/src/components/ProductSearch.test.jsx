import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductSearch from './ProductSearch';

// Mock the API modules
vi.mock('../services/api', () => ({
  productsAPI: {
    getCategories: vi.fn().mockResolvedValue({ data: { categories: ['dairy', 'bread'] } }),
    search: vi.fn().mockResolvedValue({ data: { count: 0, results: [] } }),
    getAll: vi.fn().mockResolvedValue({ data: { products: [] } }),
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

describe('ProductSearch Component', () => {
  it('renders search title', () => {
    render(<ProductSearch />);
    expect(screen.getByText('Buscar Productos')).toBeInTheDocument();
  });

  it('renders search by name label', () => {
    render(<ProductSearch />);
    expect(screen.getByText('Buscar por nombre')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<ProductSearch />);
    expect(screen.getByText('Buscar')).toBeInTheDocument();
  });

  it('renders barcode section', () => {
    render(<ProductSearch />);
    expect(screen.getByText(/código de barras/i)).toBeInTheDocument();
  });

  it('renders scan button', () => {
    render(<ProductSearch />);
    expect(screen.getByText('Escanear')).toBeInTheDocument();
  });

  it('has search input', () => {
    render(<ProductSearch />);
    const input = screen.getByPlaceholderText('Ej: leche, pan, arroz...');
    expect(input).toBeInTheDocument();
  });

  it('updates search input on type', () => {
    render(<ProductSearch />);
    const input = screen.getByPlaceholderText('Ej: leche, pan, arroz...');
    fireEvent.change(input, { target: { value: 'leche' } });
    expect(input.value).toBe('leche');
  });
});
