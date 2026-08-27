import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      total_signals: 100,
      total_alerts: 5,
      managers: [],
      recent_alerts: [],
      top_pairs: [],
    }),
  })
) as any;

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  });
});
