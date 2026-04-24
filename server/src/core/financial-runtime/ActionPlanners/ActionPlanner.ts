import { ExecutableAction, PolicyAction, RuntimeEvent } from '../types';

type EventPayloadLike = {
  amount?: unknown;
  asset?: unknown;
  chain?: unknown;
};

export class ActionPlanner {
  plan(event: RuntimeEvent, actions: PolicyAction[]): ExecutableAction[] {
    const payload = event.payload as EventPayloadLike;
    const baseAmount = this.toNumber(payload.amount);
    const defaultAsset = this.toString(payload.asset);
    const defaultChain = this.toString(payload.chain);

    return actions.flatMap((action): ExecutableAction[] => {
      if (action.type === 'TRANSFER_FUNDS') {
        return [
          {
            type: 'TRANSFER_FUNDS',
            config: { ...action.config },
          },
        ];
      }

      if (action.type === 'SWAP_FUNDS') {
        return [
          {
            type: 'SWAP_FUNDS',
            config: { ...action.config },
          },
        ];
      }

      if (action.type === 'INVEST_FUNDS') {
        return [
          {
            type: 'INVEST_FUNDS',
            config: { ...action.config },
          },
        ];
      }

      if (action.type === 'ALLOCATE_FUNDS') {
        if (baseAmount === null) return [];

        return action.config.allocations.flatMap((allocation): ExecutableAction[] => {
          const amount = this.percentAmount(baseAmount, allocation.percentage);

          if (allocation.kind === 'retain') {
            return [
              {
                type: 'RETAIN_FUNDS',
                config: {
                  amount,
                  label: allocation.label,
                },
              },
            ];
          }

          if (allocation.kind === 'transfer') {
            const asset = allocation.asset ?? defaultAsset;
            const chain = allocation.chain ?? defaultChain;

            if (!asset || !chain) return [];

            return [
              {
                type: 'TRANSFER_FUNDS',
                config: {
                  to: allocation.to,
                  amount,
                  asset,
                  chain,
                  label: allocation.label,
                },
              },
            ];
          }

          const fromAsset = allocation.fromAsset ?? defaultAsset;
          const chain = allocation.chain ?? defaultChain;

          if (!fromAsset || !chain) return [];

          return [
            {
              type: 'SWAP_FUNDS',
              config: {
                amount,
                fromAsset,
                toAsset: allocation.toAsset,
                chain,
                strategy: allocation.strategy,
                label: allocation.label,
              },
            },
          ];
        });
      }

      return [];
    });
  }

  private percentAmount(baseAmount: number, percent: number): string {
    return ((baseAmount * percent) / 100).toFixed(8);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }

    return null;
  }

  private toString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }
}