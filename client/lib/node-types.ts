import ActionNode from '@/components/custom-nodes/action-node';
import InputNode from '@/components/custom-nodes/input-node';
import OutputNode from '@/components/custom-nodes/output-node';
import ConditionNode from '@/components/custom-nodes/condition-node';
import ProcessingNode from '@/components/custom-nodes/processing-node';
import CryptoWalletNode from '@/components/custom-nodes/crypto-wallet-node';
import CryptoTradeNode from '@/components/custom-nodes/crypto-trade-node';
import TradingBotNode from '@/components/custom-nodes/trading-bot-node';
import TelegramNode from '@/components/custom-nodes/telegram-node';
import BlockchainNode from '@/components/custom-nodes/blockchain-node';

// Make sure we're exporting a plain object with component references
export const nodeTypes = {
  action: ActionNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
  processing: ProcessingNode,
  crypto_wallet: CryptoWalletNode,
  crypto_trade: CryptoTradeNode,
  trading_bot: TradingBotNode,
  telegram: TelegramNode,
  blockchain_tool: BlockchainNode,
};
