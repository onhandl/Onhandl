'use client';

interface TradingAnalysisSectionProps {
    outputData: any;
}

export function TradingAnalysisSection({ outputData }: TradingAnalysisSectionProps) {
    if (!outputData?.recommendation) return null;

    const { recommendation, performance } = outputData;

    return (
        <div className="space-y-4">
            <h4 className="font-medium">Trading Bot Analysis</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Recommendation:</span>
                        <span
                            className={`text-sm px-3 py-1 rounded-full font-medium ${recommendation.action === 'buy'
                                ? 'bg-primary/10 text-primary'
                                : recommendation.action === 'sell'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {recommendation.action === 'buy'
                                ? 'Buy'
                                : recommendation.action === 'sell'
                                    ? 'Sell'
                                    : 'Hold'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm font-medium">Token:</span>
                        <span className="text-sm">{recommendation.token}</span>
                    </div>
                    {recommendation.amount && (
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Amount:</span>
                            <span className="text-sm">{recommendation.amount}</span>
                        </div>
                    )}
                    {recommendation.price && (
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Price:</span>
                            <span className="text-sm">
                                ${recommendation.price.toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="text-xs mt-2 text-black-600">
                        {recommendation.reason}
                    </div>
                </div>

                {performance && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium mb-2">Performance Metrics</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between">
                                <span className="text-xs">Win Rate:</span>
                                <span
                                    className={`text-xs ${Number.parseFloat(performance.winRate) > 50
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}
                                >
                                    {performance.winRate}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs">Profit:</span>
                                <span
                                    className={`text-xs ${Number.parseFloat(performance.profit) > 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}
                                >
                                    {Number.parseFloat(performance.profit) > 0 ? '+' : ''}
                                    {performance.profit}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
