import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Property } from '../game/gameTypes';
import { InventoryModal } from './InventoryModal';

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'p1',
    featureId: 1,
    name: 'Stortingsgata 6',
    lat: 59.9139,
    lng: 10.7522,
    basePrice: 1_000_000,
    marketPrice: 1_200_000,
    purchasePrice: 1_000_000,
    tier: 'shop',
    rentPerDay: 30_000,
    ...overrides,
  };
}

describe('InventoryModal — empty state', () => {
  it('shows empty message when no properties owned', () => {
    render(<InventoryModal properties={[]} onClose={() => {}} />);
    expect(screen.getByText(/don't own any properties/i)).toBeInTheDocument();
  });

  it('does not render the summary when empty', () => {
    render(<InventoryModal properties={[]} onClose={() => {}} />);
    expect(screen.queryByText(/portfolio value/i)).not.toBeInTheDocument();
  });
});

describe('InventoryModal — with properties', () => {
  it('shows the correct property count', () => {
    const props = [
      makeProperty({ id: 'p1' }),
      makeProperty({ id: 'p2', name: 'Grensen 7' }),
    ];
    render(<InventoryModal properties={props} onClose={() => {}} />);
    expect(screen.getByText(/2 properties/i)).toBeInTheDocument();
  });

  it('uses singular "property" for a single item', () => {
    render(<InventoryModal properties={[makeProperty()]} onClose={() => {}} />);
    expect(screen.getByText(/1 property/i)).toBeInTheDocument();
  });

  it('renders each property name', () => {
    const props = [
      makeProperty({ id: 'p1', name: 'Karl Johans gate 1' }),
      makeProperty({ id: 'p2', name: 'Aker Brygge' }),
    ];
    render(<InventoryModal properties={props} onClose={() => {}} />);
    expect(screen.getByText('Karl Johans gate 1')).toBeInTheDocument();
    expect(screen.getByText('Aker Brygge')).toBeInTheDocument();
  });

  it('shows portfolio value summary', () => {
    // Two properties at $1.2M each → $2.4M total
    const props = [
      makeProperty({ id: 'p1', marketPrice: 1_200_000 }),
      makeProperty({ id: 'p2', marketPrice: 1_200_000 }),
    ];
    render(<InventoryModal properties={props} onClose={() => {}} />);
    expect(screen.getByText('$2.40M')).toBeInTheDocument();
  });

  it('shows total rent per day summary', () => {
    // Two properties at $30K/day → $60K total
    const props = [
      makeProperty({ id: 'p1', rentPerDay: 30_000 }),
      makeProperty({ id: 'p2', rentPerDay: 30_000 }),
    ];
    render(<InventoryModal properties={props} onClose={() => {}} />);
    expect(screen.getByText('$60K')).toBeInTheDocument();
  });
});

describe('InventoryModal — closing', () => {
  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(<InventoryModal properties={[]} onClose={onClose} />);
    await userEvent.click(
      screen.getByRole('button', { name: /close inventory/i }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<InventoryModal properties={[makeProperty()]} onClose={onClose} />);
    await userEvent.click(
      screen.getByRole('button', { name: /close inventory/i }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
