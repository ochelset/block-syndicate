import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

describe('Header', () => {
  it('calls onOpenModal with "inventory" when Inventory is clicked', async () => {
    const onOpenModal = vi.fn();
    render(<Header onOpenModal={onOpenModal} />);
    await userEvent.click(screen.getByRole('button', { name: /inventory/i }));
    expect(onOpenModal).toHaveBeenCalledWith('inventory');
  });

  it('calls onOpenModal with "settings" when Settings is clicked', async () => {
    const onOpenModal = vi.fn();
    render(<Header onOpenModal={onOpenModal} />);
    await userEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(onOpenModal).toHaveBeenCalledWith('settings');
  });
});
