import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Heatmap from '../pages/Heatmap';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      managers: [],
      correlations: [],
      asset_classes: ['equities'],
    }),
  })
) as any;

describe('Heatmap', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Heatmap />
      </BrowserRouter>
    );
  });
});
