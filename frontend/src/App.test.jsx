import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { server } from './test/mocks/server';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  it('renders the app header with logo', () => {
    render(<App />);
    expect(screen.getByText('LiquiVerde')).toBeInTheDocument();
  });

  it('renders all navigation buttons', () => {
    render(<App />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Optimizador')).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.getByText('Tiendas')).toBeInTheDocument();
  });

  it('switches to Products tab when clicked', () => {
    render(<App />);
    const productosBtn = screen.getByText('Productos');
    fireEvent.click(productosBtn);
    expect(productosBtn.closest('button')).toHaveClass('active');
  });

  it('switches to Optimizer tab when clicked', () => {
    render(<App />);
    const optimizadorBtn = screen.getByText('Optimizador');
    fireEvent.click(optimizadorBtn);
    expect(optimizadorBtn.closest('button')).toHaveClass('active');
  });

  it('switches to Compare tab when clicked', () => {
    render(<App />);
    const compararBtn = screen.getByText('Comparar');
    fireEvent.click(compararBtn);
    expect(compararBtn.closest('button')).toHaveClass('active');
  });

  it('switches to Stores tab when clicked', () => {
    render(<App />);
    const tiendasBtn = screen.getByText('Tiendas');
    fireEvent.click(tiendasBtn);
    expect(tiendasBtn.closest('button')).toHaveClass('active');
  });

  it('renders footer with correct text', () => {
    render(<App />);
    expect(screen.getByText('LiquiVerde Smart Retail Platform')).toBeInTheDocument();
  });

  it('starts with Dashboard tab active', () => {
    render(<App />);
    const dashboardBtn = screen.getByText('Dashboard');
    expect(dashboardBtn.closest('button')).toHaveClass('active');
  });
});
