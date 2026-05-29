import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartScreen } from './StartScreen';

describe('StartScreen — no saved game', () => {
  it('renders the New Game button', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(
      screen.getByRole('button', { name: /new game/i }),
    ).toBeInTheDocument();
  });

  it('calls onStart when New Game is clicked', async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('does not show the Continue button', () => {
    render(<StartScreen onStart={() => {}} />);
    expect(
      screen.queryByRole('button', { name: /continue/i }),
    ).not.toBeInTheDocument();
  });
});

describe('StartScreen — with saved game', () => {
  it('shows Continue and New Game buttons', () => {
    render(
      <StartScreen onStart={() => {}} onContinue={() => {}} savedDay={12} />,
    );
    expect(
      screen.getByRole('button', { name: /continue/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new game/i }),
    ).toBeInTheDocument();
  });

  it('displays the saved day in the Continue button', () => {
    render(
      <StartScreen onStart={() => {}} onContinue={() => {}} savedDay={42} />,
    );
    expect(
      screen.getByRole('button', { name: /continue.*42/i }),
    ).toBeInTheDocument();
  });

  it('calls onContinue when Continue is clicked', async () => {
    const onContinue = vi.fn();
    render(
      <StartScreen onStart={() => {}} onContinue={onContinue} savedDay={5} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('calls onStart when New Game is clicked', async () => {
    const onStart = vi.fn();
    render(
      <StartScreen onStart={onStart} onContinue={() => {}} savedDay={5} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
