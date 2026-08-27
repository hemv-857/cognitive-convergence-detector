import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Alerts from '../pages/Alerts';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      alerts: [],
      total: 0,
    }),
  })
) as any;

describe('Alerts', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Alerts />
      </BrowserRouter>
    );
  });
});
