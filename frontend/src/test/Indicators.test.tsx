import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Indicators from '../pages/Indicators';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      managers: [],
      indicators: {},
    }),
  })
) as any;

describe('Indicators', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Indicators />
      </BrowserRouter>
    );
  });
});
