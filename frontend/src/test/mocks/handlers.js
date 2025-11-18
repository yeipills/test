import { http, HttpResponse } from 'msw';

export const handlers = [
  // Stats endpoint
  http.get('/api/stats', () => {
    return HttpResponse.json({
      total_products: 20,
      categories_count: 10,
      average_price: 2500,
      price_range: { min: 800, max: 5000 },
      categories: {
        dairy: 3,
        bread: 2,
        fruits: 3,
        vegetables: 3,
        proteins: 3,
        grains: 2,
        beverages: 2,
        snacks: 1,
        condiments: 1,
      },
      labels: {
        organic: 5,
        local: 8,
        fair_trade: 3,
        recyclable: 6,
      },
    });
  }),

  // Products endpoint
  http.get('/api/products/', () => {
    return HttpResponse.json({
      count: 20,
      products: [
        {
          id: 'milk-001',
          name: 'Leche Entera Colun',
          brand: 'Colun',
          category: 'dairy',
          price: 1290,
          labels: ['local'],
        },
        {
          id: 'bread-001',
          name: 'Pan Integral Ideal',
          brand: 'Ideal',
          category: 'bread',
          price: 1890,
          labels: ['organic'],
        },
      ],
    });
  }),

  // Categories endpoint
  http.get('/api/products/categories', () => {
    return HttpResponse.json({
      categories: ['dairy', 'bread', 'fruits', 'vegetables', 'proteins', 'grains', 'beverages', 'snacks', 'condiments', 'frozen'],
    });
  }),

  // Search endpoint
  http.get('/api/products/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';

    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: 'milk-001',
          name: 'Leche Entera Colun',
          brand: 'Colun',
          category: 'dairy',
          price: 1290,
          labels: ['local'],
        },
      ],
    });
  }),

  // Top sustainable
  http.get('/api/recommendations/top-sustainable', () => {
    return HttpResponse.json({
      products: [
        {
          product: {
            id: 'quinoa-001',
            name: 'Quinoa Organica',
            brand: 'Grano Vivo',
            category: 'grains',
            price: 3990,
          },
          sustainability_score: {
            overall_score: 85,
            economic_score: 70,
            environmental_score: 95,
            social_score: 80,
            health_score: 90,
          },
        },
      ],
    });
  }),

  // Best value
  http.get('/api/recommendations/best-value', () => {
    return HttpResponse.json({
      products: [
        {
          product: {
            id: 'rice-001',
            name: 'Arroz Integral',
            brand: 'Miraflores',
            category: 'grains',
            price: 1590,
          },
          value_score: 88,
        },
      ],
    });
  }),

  // Savings opportunities
  http.get('/api/recommendations/savings-opportunities', () => {
    return HttpResponse.json({
      opportunities: [
        {
          expensive_product: {
            id: 'milk-002',
            name: 'Leche Premium',
            price: 2500,
          },
          better_alternative: {
            id: 'milk-001',
            name: 'Leche Colun',
            price: 1290,
          },
          savings: 1210,
          savings_percentage: 48.4,
          sustainability_improvement: 5,
        },
      ],
    });
  }),

  // Templates
  http.get('/api/shopping-list/templates', () => {
    return HttpResponse.json({
      templates: {
        basico: ['Leche', 'Pan', 'Huevos', 'Arroz'],
        saludable: ['Quinoa', 'Espinaca', 'Salmon', 'Palta'],
      },
    });
  }),
];
