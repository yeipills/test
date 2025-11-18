import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoreMap from './StoreMap';

// Mock Google Maps
vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: vi.fn(() => ({
    isLoaded: false,
    loadError: null,
  })),
  GoogleMap: vi.fn(({ children }) => <div data-testid="google-map">{children}</div>),
  Marker: vi.fn(() => null),
  InfoWindow: vi.fn(({ children }) => <div data-testid="info-window">{children}</div>),
}));

describe('StoreMap Component', () => {
  it('renders the store map title', () => {
    render(<StoreMap />);
    expect(screen.getByText('Mapa de Tiendas Cercanas')).toBeInTheDocument();
  });

  it('renders location button', () => {
    render(<StoreMap />);
    expect(screen.getByText('Mi ubicacion')).toBeInTheDocument();
  });

  it('renders filter checkboxes', () => {
    render(<StoreMap />);
    expect(screen.getByText('Organicos')).toBeInTheDocument();
    // "Locales" appears multiple times (filter label + badges), so use getAllByText
    expect(screen.getAllByText('Locales').length).toBeGreaterThan(0);
  });

  it('renders stores list', () => {
    render(<StoreMap />);
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
    expect(screen.getByText('Lider Providencia')).toBeInTheDocument();
    expect(screen.getByText('Santa Isabel Vitacura')).toBeInTheDocument();
  });

  it('displays store count', () => {
    render(<StoreMap />);
    // Use more specific regex to match "Tiendas (5)" not "Mapa de Tiendas Cercanas"
    expect(screen.getByText(/Tiendas \(/)).toBeInTheDocument();
  });

  it('shows store details when clicked', () => {
    render(<StoreMap />);
    const store = screen.getByText('Jumbo Kennedy');
    fireEvent.click(store.closest('div[class="product-item"]'));
    expect(screen.getByText('Cómo llegar')).toBeInTheDocument();
  });

  it('filters stores by organic checkbox', () => {
    render(<StoreMap />);
    const checkboxes = screen.getAllByRole('checkbox');
    const organicCheckbox = checkboxes[0]; // First checkbox is organic
    fireEvent.click(organicCheckbox);

    // Santa Isabel doesn't have organic
    expect(screen.queryByText('Santa Isabel Vitacura')).not.toBeInTheDocument();
    // Jumbo does have organic
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
  });

  it('filters stores by local checkbox', () => {
    render(<StoreMap />);
    const checkboxes = screen.getAllByRole('checkbox');
    const localCheckbox = checkboxes[1]; // Second checkbox is local
    fireEvent.click(localCheckbox);

    // Lider doesn't have local
    expect(screen.queryByText('Lider Providencia')).not.toBeInTheDocument();
    // Jumbo does have local
    expect(screen.getByText('Jumbo Kennedy')).toBeInTheDocument();
  });

  it('displays store distance', () => {
    render(<StoreMap />);
    expect(screen.getByText('1.2 km')).toBeInTheDocument();
  });

  it('shows API key warning when not configured', () => {
    render(<StoreMap />);
    expect(screen.getByText(/API Key de Google Maps no configurada/)).toBeInTheDocument();
  });

  it('opens Google Maps when directions button is clicked', () => {
    const mockOpen = vi.fn();
    window.open = mockOpen;

    render(<StoreMap />);
    const store = screen.getByText('Jumbo Kennedy');
    fireEvent.click(store.closest('div[class="product-item"]'));

    const directionsBtn = screen.getByText('Cómo llegar');
    fireEvent.click(directionsBtn);

    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('google.com/maps'),
      '_blank'
    );
  });
});
