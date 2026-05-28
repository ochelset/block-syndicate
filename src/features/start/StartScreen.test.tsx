import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from './StartScreen';

describe('StartScreen', () => {
  it('renders the Enter button', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument();
  });

  it('calls onStart when Enter is clicked', async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole('button', { name: /enter/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
