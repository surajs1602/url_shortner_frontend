// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock the whole admin service so no real fetch happens.
vi.mock('../lib/adminApi.js', () => ({
  setUnauthorizedHandler: vi.fn(),
  adminApi: {
    listUrls:   vi.fn(),
    disableUrl: vi.fn().mockResolvedValue({ status: 'Success' }),
    enableUrl:  vi.fn().mockResolvedValue({ status: 'Success' }),
    deleteUrl:  vi.fn().mockResolvedValue({ status: 'Success' }),
  },
}));

import { adminApi } from '../lib/adminApi.js';
import { ToastProvider } from '../components/ui/Toast.jsx';
import LinksPage from './LinksPage.jsx';

const sampleRow = {
  shortId: 'abc123',
  finalUrl: 'https://example.com/page',
  submittedUrl: 'https://example.com/page',
  isActive: true, isBlocked: false, isReachable: true,
  httpStatus: 200, abuseReportCount: 0, visitHistory: [{ timestamp: Date.now() }],
  createdAt: new Date().toISOString(), lastHealthCheck: new Date().toISOString(),
};

const wrap = ui => render(<ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>);

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => cleanup());

describe('LinksPage', () => {
  it('loads and renders link rows from the admin API', async () => {
    adminApi.listUrls.mockResolvedValue([sampleRow]);
    wrap(<LinksPage />);
    expect(await screen.findByText('abc123')).toBeTruthy();
    expect(adminApi.listUrls).toHaveBeenCalled();
  });

  it('disables a link through the confirm dialog', async () => {
    adminApi.listUrls.mockResolvedValue([sampleRow]);
    wrap(<LinksPage />);
    await screen.findByText('abc123');

    fireEvent.click(screen.getByTitle('Disable'));          // open dialog
    fireEvent.click(await screen.findByText('Pause link')); // confirm

    await waitFor(() => expect(adminApi.disableUrl).toHaveBeenCalledWith('abc123', undefined));
  });

  it('shows an empty state when no links match', async () => {
    adminApi.listUrls.mockResolvedValue([]);
    wrap(<LinksPage />);
    expect(await screen.findByText(/No links match/i)).toBeTruthy();
  });
});
