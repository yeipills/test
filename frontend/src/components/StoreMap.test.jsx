import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoreMap from './StoreMap';

describe('StoreMap Component', () => {
  it('renders the store map title', () => {
    render(<StoreMap />);
    expect(screen.getByText('Mapa de Tiendas Cercanas')).toBeInTheDocument();
  });

  it('renders location button', () => {
    render(<StoreMap />);
    expect(screen.getByText('Usar mi ubicacion')).toBeInTheDocument();
  });

  it('renders filter checkboxes', () => {
    render(<StoreMap />);
    expect(screen.getByText('Productos organicos')).toBeInTheDocument();
    expect(screen.getByText('Productos locales')).toBeInTheDocument();
  });

  it('renders stores list', () => {
    render(<StoreMap />);
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
    expect(screen.getByText('Lider Providencia')).toBeInTheDocument();
    expect(screen.getByText('Santa Isabel Vitacura')).toBeInTheDocument();
  });

  it('displays store count', () => {
    render(<StoreMap />);
    expect(screen.getByText(/Tiendas Disponibles/)).toBeInTheDocument();
  });

  it('shows store details when clicked', () => {
    render(<StoreMap />);
    const store = screen.getByText('Jumbo Kennedy');
    fireEvent.click(store.closest('div[style]'));
    expect(screen.getByText('Como llegar')).toBeInTheDocument();
    expect(screen.getByText('Ver en mapa')).toBeInTheDocument();
  });

  it('filters stores by organic checkbox', () => {
    render(<StoreMap />);
    const organicCheckbox = screen.getByText('Productos organicos').previousSibling;
    fireEvent.click(organicCheckbox);

    // Santa Isabel doesn't have organic
    expect(screen.queryByText('Santa Isabel Vitacura')).not.toBeInTheDocument();
    // Jumbo does have organic
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
  });

  it('filters stores by local checkbox', () => {
    render(<StoreMap />);
    const localCheckbox = screen.getByText('Productos locales').previousSibling;
    fireEvent.click(localCheckbox);

    // Lider doesn't have local
    expect(screen.queryByText('Lider Providencia')).not.toBeInTheDocument();
    // Jumbo does have local
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
  });

  it('shows OpenStreetMap link', () => {
    render(<StoreMap />);
    expect(screen.getByText('Ver en OpenStreetMap')).toBeInTheDocument();
  });

  it('displays store distance', () => {
    render(<StoreMap />);
    expect(screen.getByText('1.2 km')).toBeInTheDocument();
  });

  it('displays store hours', () => {
    render(<StoreMap />);
    expect(screen.getByText('8:00 - 22:00')).toBeInTheDocument();
  });

  it('opens Google Maps when "Como llegar" is clicked', () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<StoreMap />);
    const store = screen.getByText('Jumbo Kennedy');
    fireEvent.click(store.closest('div[style]'));

    const comoLlegarBtn = screen.getByText('Como llegar');
    fireEvent.click(comoLlegarBtn);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );
  });
});
