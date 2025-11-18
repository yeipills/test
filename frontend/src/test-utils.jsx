import { render } from '@testing-library/react';
import { ToastProvider } from './components/Toast';
import { createContext } from 'react';

// Mock Navigation Context
const NavigationContext = createContext({
  navigateTo: () => {},
  navigationData: null,
  clearNavigationData: () => {},
  activeTab: 'dashboard'
});

// Wrapper component that provides all necessary contexts
function AllProviders({ children }) {
  return (
    <ToastProvider>
      <NavigationContext.Provider value={{
        navigateTo: () => {},
        navigationData: null,
        clearNavigationData: () => {},
        activeTab: 'dashboard'
      }}>
        {children}
      </NavigationContext.Provider>
    </ToastProvider>
  );
}

// Custom render function
const customRender = (ui, options) =>
  render(ui, { wrapper: AllProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
