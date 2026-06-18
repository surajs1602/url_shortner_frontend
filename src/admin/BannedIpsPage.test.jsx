// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/adminApi.js', () => ({
  setUnauthorizedHandler: vi.fn(),
  adminApi: {
    bannedIps: vi.fn(),
    banIp:     vi.fn().mockResolvedValue({ status: 'Success', ip: '203.0.113.7' }),
    unbanIp:   vi.fn().mockResolvedValue({ status: 'Success' }),
  },
}));

import { adminApi } from '../lib/adminApi.js';
import { ToastProvider } from '../components/ui/Toast.jsx';
import BannedIpsPage from './BannedIpsPage.jsx';

const wrap = ui => render(<ToastProvider><MemoryRouter>{ui}</MemoryRouter></ToastProvider>);

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => cleanup());

describe('BannedIpsPage', () => {
  it('bans an IP from the form and reloads the list', async () => {
    adminApi.bannedIps.mockResolvedValue([]);
    wrap(<BannedIpsPage />);
    await screen.findByText(/No banned IPs/i);

    fireEvent.change(screen.getByPlaceholderText(/203\.0\.113\.7/), { target: { value: '203.0.113.7' } });
    fireEvent.click(screen.getByText('Ban IP'));

    await waitFor(() => expect(adminApi.banIp).toHaveBeenCalledWith('203.0.113.7', undefined));
    // list is refetched after a successful ban (mount + post-ban)
    await waitFor(() => expect(adminApi.bannedIps).toHaveBeenCalledTimes(2));
  });

  it('surfaces a 400 (missing IP) as a form error without calling banIp twice', async () => {
    adminApi.bannedIps.mockResolvedValue([]);
    wrap(<BannedIpsPage />);
    await screen.findByText(/No banned IPs/i);

    fireEvent.click(screen.getByText('Ban IP')); // empty IP
    expect(await screen.findByText(/Enter an IP address/i)).toBeTruthy();
    expect(adminApi.banIp).not.toHaveBeenCalled();
  });

  it('renders existing bans in the table', async () => {
    adminApi.bannedIps.mockResolvedValue([{ ip: '10.0.0.5', reason: 'spam', bannedBy: 'op', createdAt: new Date().toISOString() }]);
    wrap(<BannedIpsPage />);
    expect(await screen.findByText('10.0.0.5')).toBeTruthy();
  });
});
