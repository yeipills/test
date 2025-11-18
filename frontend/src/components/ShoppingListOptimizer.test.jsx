import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShoppingListOptimizer from './ShoppingListOptimizer';

// Mock the API modules
vi.mock('../services/api', () => ({
  shoppingListAPI: {
    getTemplates: vi.fn().mockResolvedValue({ data: { templates: {} } }),
    optimize: vi.fn().mockResolvedValue({ data: {} }),
  },
  productsAPI: {
    getCategories: vi.fn().mockResolvedValue({ data: { categories: ['dairy', 'bread'] } }),
  },
}));

describe('ShoppingListOptimizer Component', () => {
  it('renders optimizer title', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText('Optimizador de Lista de Compras')).toBeInTheDocument();
  });

  it('renders budget input label', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText('Presupuesto (CLP)')).toBeInTheDocument();
  });

  it('renders optimization mode selector', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText('Optimizar para')).toBeInTheDocument();
  });

  it('renders add item button', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText('Agregar Item')).toBeInTheDocument();
  });

  it('renders optimize button', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText('Optimizar Lista de Compras')).toBeInTheDocument();
  });

  it('allows changing budget', () => {
    render(<ShoppingListOptimizer />);
    const budgetInputs = screen.getAllByRole('spinbutton');
    const budgetInput = budgetInputs[0];
    fireEvent.change(budgetInput, { target: { value: '25000' } });
    expect(budgetInput.value).toBe('25000');
  });

  it('shows optimization mode options in select', () => {
    render(<ShoppingListOptimizer />);
    const select = screen.getByDisplayValue('Balanceado');
    expect(select).toBeInTheDocument();
  });

  it('allows changing optimization mode', () => {
    render(<ShoppingListOptimizer />);
    const select = screen.getByDisplayValue('Balanceado');
    fireEvent.change(select, { target: { value: 'price' } });
    expect(select.value).toBe('price');
  });

  it('shows empty list message initially', () => {
    render(<ShoppingListOptimizer />);
    expect(screen.getByText(/No hay items en la lista/)).toBeInTheDocument();
  });
});
