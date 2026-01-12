import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Clock, Target, Zap, Edit, Save, X } from 'lucide-react';

const BTCPredictionTrader = () => {
  const [btcPrice, setBtcPrice] = useState(94250);
  const [priceHistory, setPriceHistory] = useState([]);
  const [bankroll, setBankroll] = useState(100);
  const [bankrollInput, setBankrollInput] = useState('100');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeToExpiry, setTimeToExpiry] = useState(45);
  const [editingPrice, setEditingPrice] = useState(null); // {price: 91000, betType: 'YES', value: '12'}
  const [customMarketPrices, setCustomMarketPrices] = useState({}); // Store custom market prices
  const [isBankrollEditing, setIsBankrollEditing] = useState(false);

  // Simulated technical indicators (in production, calculate from real data)
  const [indicators, setIndicators] = useState({
    rsi: 62,
    macd: 0.8,
    bollingerPosition: 0.6,
    volume: 1.3,
    supportLevel: 93800,
    resistanceLevel: 94600
  });

  // Fetch live BTC price
    useEffect(() => {
        const fetchPrice = async () => {
        try {
        const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
        const data = await response.json();
        const price = parseFloat(data.data.amount);
        setBtcPrice(price);
        
        // Update price history
        const CHART_HISTORY_POINTS = 20;

        setPriceHistory(prev => {
            const newHistory = [...prev, { time: new Date().toLocaleTimeString(), price }];
            return newHistory.slice(-CHART_HISTORY_POINTS);
        });
        
        setLoading(false);
        } catch (error) {
        console.error('Error fetching BTC price:', error);
        setBtcPrice(prev => prev + (Math.random() - 0.5) * 100);
        }
    };

  // Initialize with historical data using Binance API
    // Initialize with historical data using CORS proxy + Binance
const initializeHistory = async () => {
  try {
    // Use CORS proxy for Binance API
    const corsProxy = 'https://corsproxy.io/?';
    const binanceUrl = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=30';
    
    const response = await fetch(`${corsProxy}${encodeURIComponent(binanceUrl)}`);
    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length > 0) {
      const historicalPrices = data.map(candle => ({
        time: new Date(candle[0]).toLocaleTimeString(),
        price: parseFloat(candle[4]) // Close price
      }));
      
      setPriceHistory(historicalPrices);
      setBtcPrice(historicalPrices[historicalPrices.length - 1].price);
      console.log(`✓ Initialized with ${historicalPrices.length} historical BTC prices from Binance`);
      return;
    }
  } catch (error) {
    console.warn('Binance via proxy failed, trying fallback...', error.message);
  }
  
  // Fallback: Use CoinGecko (usually more CORS-friendly)
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    const data = await response.json();
    const currentPrice = data.bitcoin?.usd || 94250;
    
    // Create synthetic history with realistic price movements
    const syntheticHistory = [];
    let price = currentPrice;
    
    for (let i = 30; i > 0; i--) {
      // Random walk with mean reversion
      const change = (Math.random() - 0.5) * 200; // ±$100 per minute
      price = price + change;
      
      syntheticHistory.push({
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        price: price
      });
    }
    
    // Add current price
    syntheticHistory.push({
      time: new Date().toLocaleTimeString(),
      price: currentPrice
    });
    
    setPriceHistory(syntheticHistory);
    setBtcPrice(currentPrice);
    console.log(`✓ Initialized with ${syntheticHistory.length} synthetic price points (CoinGecko current: $${currentPrice})`);
    
  } catch (fallbackError) {
    console.error('All historical data sources failed:', fallbackError);
    
    // Last resort: Pure synthetic data
    const basePrice = 94250;
    const syntheticHistory = [];
    let price = basePrice;
    
    for (let i = 30; i > 0; i--) {
      price = price + (Math.random() - 0.5) * 200;
      syntheticHistory.push({
        time: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        price: price
      });
    }
    
    setPriceHistory(syntheticHistory);
    setBtcPrice(basePrice);
    console.log('⚠ Using fully synthetic price history');
  }
  
  setLoading(false);
};

    if (priceHistory.length === 0) {
        initializeHistory();
    }

    const PRICE_UPDATE_INTERVAL = 30000; // 1 minutes in milliseconds (adjustable)

    fetchPrice();
    const interval = setInterval(fetchPrice, PRICE_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Calculate technical indicators (simplified simulation)
  // TODO: calcualte the indicators without randcom numbers
  // Calculate technical indicators from real price data
    useEffect(() => {
        const calculateIndicators = () => {
            // Check if we have enough data
            if (priceHistory.length < 2) return; // Need at least 2 data points for any calculation

            const prices = priceHistory.map(p => p.price);
            
            // === 1. Calculate RSI (14-period) ===
            const calculateRSI = (prices, period = 14) => {
                // If we don't have enough data for full period, use what we have
                const availablePeriod = Math.min(period, prices.length - 1);
                if (availablePeriod < 1) return 50;
                
                let gains = 0;
                let losses = 0;
                
                // Start from the available data we have
                const startIndex = Math.max(0, prices.length - availablePeriod - 1);
                
                for (let i = startIndex + 1; i < prices.length; i++) {
                    const change = prices[i] - prices[i - 1];
                    if (change > 0) gains += change;
                    else losses += Math.abs(change);
                }
                
                const avgGain = gains / availablePeriod;
                const avgLoss = losses / availablePeriod;
                
                if (avgLoss === 0) return 100;
                const rs = avgGain / avgLoss;
                return 100 - (100 / (1 + rs));
            };
            
            // === 2. Calculate MACD ===
            const calculateEMA = (prices, period) => {
                // Use the minimum between requested period and available data
                const usePeriod = Math.min(period, prices.length);
                const multiplier = 2 / (usePeriod + 1);
                
                // Start with the first available price as EMA
                let ema = prices[0];
                
                // Calculate EMA with available data
                for (let i = 1; i < prices.length; i++) {
                    ema = (prices[i] - ema) * multiplier + ema;
                }
                return ema;
            };
            
            // Only calculate MACD if we have enough data points
            // Need at least 2 for EMA12 and 3 for EMA26, but we'll work with what we have
            const ema12Period = Math.min(12, prices.length);
            const ema26Period = Math.min(26, prices.length);
            
            const ema12 = calculateEMA(prices, ema12Period);
            const ema26 = calculateEMA(prices, ema26Period);
            const macd = ema12 - ema26;
            
            // === 3. Calculate Bollinger Bands (20-period) ===
            const calculateBollingerBands = (prices, period = 20) => {
                // Use available data or fallback to current price
                const usePeriod = Math.min(period, prices.length);
                
                if (usePeriod < 1) {
                    return {
                        upper: btcPrice,
                        middle: btcPrice,
                        lower: btcPrice
                    };
                }
                
                const recentPrices = prices.slice(-usePeriod);
                const sma = recentPrices.reduce((a, b) => a + b, 0) / usePeriod;
                
                // Calculate standard deviation
                const squaredDiffs = recentPrices.map(p => Math.pow(p - sma, 2));
                const variance = squaredDiffs.reduce((a, b) => a + b, 0) / usePeriod;
                const stdDev = Math.sqrt(variance);
                
                return {
                    upper: sma + (2 * stdDev),
                    middle: sma,
                    lower: sma - (2 * stdDev)
                };
            };
            
            const bollinger = calculateBollingerBands(prices);
            const bollingerPosition = bollinger.upper !== bollinger.lower 
                ? (btcPrice - bollinger.lower) / (bollinger.upper - bollinger.lower)
                : 0.5; // Default to middle if bands are the same
            
            // === 4. Calculate Volume Proxy (using price volatility) ===
            const calculateVolatility = (prices, period = 10) => {
                const usePeriod = Math.min(period, prices.length - 1);
                if (usePeriod < 1) return 1;
                
                const recentPrices = prices.slice(-(usePeriod + 1)); // +1 because we need pairs
                const returns = [];
                
                for (let i = 1; i < recentPrices.length; i++) {
                    returns.push((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]);
                }
                
                if (returns.length === 0) return 1;
                
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const squaredDiffs = returns.map(r => Math.pow(r - avgReturn, 2));
                const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
                const volatility = Math.sqrt(variance);
                
                // Normalize to 0.5-2.0 range (higher volatility = higher volume proxy)
                return Math.min(2, Math.max(0.5, 1 + volatility * 100));
            };
            
            // Calculate indicators with fallback values
            const rsi = priceHistory.length >= 2 ? calculateRSI(prices) : 50;
            const volume = priceHistory.length >= 2 ? calculateVolatility(prices) : 1;
            
            setIndicators(prev => ({
                ...prev,
                rsi: Math.max(0, Math.min(100, rsi)),
                macd: priceHistory.length >= 2 ? macd / btcPrice * 100 : 0, // Normalize MACD
                bollingerPosition: Math.max(0, Math.min(1, bollingerPosition)),
                volume,
                supportLevel: bollinger.lower,
                resistanceLevel: bollinger.upper
            }));
        };

        calculateIndicators();
        const interval = setInterval(calculateIndicators, 30000); // Recalculate every 1 minute
        return () => clearInterval(interval);
    }, [priceHistory, btcPrice]);

  // Pattern detection (simplified)
  const detectPatterns = () => {
    const patterns = [];
    
    if (indicators.rsi > 70) patterns.push({ name: 'Overbought (RSI > 70)', bearish: true });
    if (indicators.rsi < 30) patterns.push({ name: 'Oversold (RSI < 30)', bullish: true });
    if (indicators.macd > 0.5) patterns.push({ name: 'MACD Bullish Crossover', bullish: true });
    if (indicators.macd < -0.5) patterns.push({ name: 'MACD Bearish Crossover', bearish: true });
    if (indicators.bollingerPosition > 0.8) patterns.push({ name: 'Upper Bollinger Band', bearish: true });
    if (indicators.bollingerPosition < 0.2) patterns.push({ name: 'Lower Bollinger Band', bullish: true });
    
    // Cup & Handle detection (simplified)
    if (priceHistory.length >= 10) {
      const recentPrices = priceHistory.slice(-10).map(p => p.price);
      const avgPrice = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const isForming = recentPrices[recentPrices.length - 1] > avgPrice;
      if (isForming) patterns.push({ name: 'Cup & Handle Forming', bullish: true });
    }

    return patterns;
  };

  // LSTM simulation (simplified - returns probability)
  const lstmPredict = () => {
    // Simulate LSTM prediction based on trend
    const trend = priceHistory.length >= 5 
      ? priceHistory.slice(-5).reduce((sum, p, i, arr) => {
          if (i === 0) return 0;
          return sum + (p.price - arr[i-1].price);
        }, 0)
      : 0;
    
    const baseProbability = 50;
    const trendInfluence = Math.min(20, Math.max(-20, trend / 50));
    const rsiInfluence = (indicators.rsi - 50) / 5;
    
    return Math.max(30, Math.min(90, baseProbability + trendInfluence + rsiInfluence));
  };

  // XGBoost simulation (simplified - returns probability)
  const xgboostPredict = () => {
    // Simulate XGBoost using multiple features
    let score = 50;
    
    // Volume influence
    score += (indicators.volume - 1) * 15;
    
    // MACD influence
    score += indicators.macd * 10;
    
    // Bollinger position influence
    score += (indicators.bollingerPosition - 0.5) * 20;
    
    // Pattern influence
    const patterns = detectPatterns();
    const bullishPatterns = patterns.filter(p => p.bullish).length;
    const bearishPatterns = patterns.filter(p => p.bearish).length;
    score += (bullishPatterns - bearishPatterns) * 5;
    
    return Math.max(30, Math.min(90, score));
  };

    const calculateBinaryOptionPrice = (currentPrice, strikePrice, timeToExpiry, baseDecayRate = 5) => {
        // Check for custom market price first
        const customKey = `${strikePrice}-${baseDecayRate}`;
        if (customMarketPrices[customKey]) {
            return customMarketPrices[customKey];
        }
        
        // For strikes already passed (in-the-money)
        if (strikePrice <= currentPrice) {
            // Below current price - very high probability
            const distance = currentPrice - strikePrice;
            const percentBelow = (distance / currentPrice) * 100;
            
            // Exponential approach to 99¢ as we go further below
            const ascentSteepness = baseDecayRate * 0.1;
            const prob = 0.95 + (0.04 * (1 - Math.exp(-percentBelow / (0.3 / ascentSteepness))));
            return Math.min(0.99, prob);
        } else {
            // Above current price - exponential decay
            const distance = strikePrice - currentPrice;
            const percentAbove = (distance / currentPrice) * 100;
            
            // Convert to minutes remaining
            const minutesRemaining = timeToExpiry;
            
            // Your specific decay rate schedule for the last hour:
            let timeAdjustedDecayRate;
            
            if (minutesRemaining <= 60) {
                // Last hour: use your specific schedule
                if (minutesRemaining <= 15) {
                    timeAdjustedDecayRate = 5; // 0-15 minutes: steepest decay
                } else if (minutesRemaining <= 30) {
                    timeAdjustedDecayRate = 6; // 15-30 minutes: steep decay
                } else if (minutesRemaining <= 50) {
                    timeAdjustedDecayRate = 8; // 30-50 minutes: moderate decay
                } else {
                    timeAdjustedDecayRate = 15; // 50-60 minutes: flat decay
                }
            } else {
                // More than 60 minutes: use base decay rate with slight time adjustment
                const hoursRemaining = minutesRemaining / 60;
                // Gradually increase decay rate as we get closer to the final hour
                if (hoursRemaining <= 4) {
                    // 1-4 hours: transition from 6 to your schedule
                    const transitionFactor = Math.max(0, Math.min(1, (4 - hoursRemaining) / 3));
                    timeAdjustedDecayRate = 6 * (1 - transitionFactor) + 2 * transitionFactor;
                } else {
                    // More than 4 hours: use base decay rate
                    timeAdjustedDecayRate = baseDecayRate;
                }
            }
            
            // Time factor for exponential: less time = more aggressive decay
            // Convert to hours for time factor calculation
            const hoursRemaining = minutesRemaining / 60;
            const timeFactor = Math.max(0.2, Math.min(2, 1 / Math.sqrt(hoursRemaining + 0.1)));
            
            // Base exponential decay probability
            let baseProb;
            
            // Special near-expiration logic for last 30 minutes
            if (minutesRemaining <= 30) {
                // In last 30 minutes, use different probability curve
                // Probability drops more slowly near the money, faster far away
                if (percentAbove <= 0.1) { // Very close (within 0.1% = ~$90 for BTC at $90k)
                    baseProb = 0.5 * Math.exp(-timeAdjustedDecayRate * percentAbove * 0.5);
                } else if (percentAbove <= 0.3) { // Moderately close (0.1-0.3%)
                    baseProb = 0.4 * Math.exp(-timeAdjustedDecayRate * percentAbove);
                } else { // Far away (>0.3%)
                    baseProb = 0.2 * Math.exp(-timeAdjustedDecayRate * percentAbove * 1.5);
                }
            } else {
                // Normal exponential decay
                baseProb = 0.5 * Math.exp(-timeAdjustedDecayRate * percentAbove * timeFactor);
            }
            
            // Volatility adjustment (makes curve flatter)
            const btcHourlyVol = 0.006; // 0.6% hourly volatility for BTC
            const volatilityBoost = btcHourlyVol * Math.sqrt(hoursRemaining) * 10;
            
            // Current market momentum factor (optional)
            // Positive momentum increases probability slightly
            const momentumFactor = 0; // Could be calculated from recent price changes
            
            let prob = baseProb + volatilityBoost + momentumFactor;
            
            if (minutesRemaining <= 5) {
                // Last 5 minutes: binary pricing emerges
                // Very close to expiration, prices approach 1¢ or 99¢
                if (percentAbove <= 0.05) { // Within 0.05% (~$45)
                    prob = Math.max(0.4, Math.min(0.95, prob));
                } else {
                    prob = Math.max(0.01, Math.min(0.6, prob));
                }
            } else if (minutesRemaining <= 15) {
                // 5-15 minutes: wider range but starting to converge
                prob = Math.max(0.05, Math.min(0.95, prob));
            } else if (minutesRemaining <= 30) {
                // 15-30 minutes: typical intra-hour range
                prob = Math.max(0.10, Math.min(0.90, prob));
            } else if (minutesRemaining <= 60) {
                // 30-60 minutes: slightly constrained
                prob = Math.max(0.15, Math.min(0.85, prob));
            } else {
                // More than 1 hour: normal constraints
                prob = Math.max(0.01, Math.min(0.85, prob));
            }
            
            // Round to nearest penny (0.01) for realistic pricing
            return Math.round(prob * 100) / 100;
        }
    };


  // extreme price penalty & edge compression
    const adjustEdgeForExtremes = (edge, marketPrice) => {
        // marketPrice is 0–1
        const cents = marketPrice * 100;

        // No penalty in the healthy range
        if (cents >= 15 && cents <= 85) return edge;

        // Distance from neutral (50c)
        const distance = Math.abs(cents - 50) / 50; // 0 at 50c, 1 at extremes

        // Smooth penalty that accelerates after ~75/25
        // Tuned for RH prediction markets
        const penaltyMultiplier = Math.max(0.4, 1 - Math.pow(Math.max(0, distance - 0.5), 1.6) * 1.5);

        return edge * penaltyMultiplier;
    };

  // Calculate signals
  useEffect(() => {
    if (priceHistory.length < 10) return;


    const calculateSignals = () => {
      const BASE_INCREMENT = 250; // Price increment (adjustable)
      const INITIAL_RANGE = 4; // Number of increments above/below current price
      
      // Round current price to nearest increment
      const currentRounded = Math.round(btcPrice / BASE_INCREMENT) * BASE_INCREMENT;
      
      // Generate initial price levels
      let priceLevels = [];
      for (let i = -INITIAL_RANGE; i <= INITIAL_RANGE; i++) {
        priceLevels.push(currentRounded + (i * BASE_INCREMENT));
      }
      
      const lstm = lstmPredict();
      const xgb = xgboostPredict();
      const avgModel = (lstm + xgb) / 2;
      
      // Determine market direction
      const isPriceRising = avgModel > 50;

      // Calculate probability for each price level WITH YES/NO options
      const contractOptions = [];
      
      priceLevels.forEach(price => {
        // Distance from current price affects probability
        const distance = price - btcPrice;
        const volatilityAdjustment = Math.abs(distance) / 500;
        
        // Calculate TRUE probability that price will be ABOVE this level
        let trueProbAbove;
        if (price < btcPrice) {
          // Below current price - high probability price stays above
          trueProbAbove = Math.min(0.99, 0.5 + (btcPrice - price) / 2000 + (avgModel - 50) / 200);
        } else {
          // Above current price - decreases with distance
          trueProbAbove = Math.max(0.01, (avgModel / 100) * Math.exp(-volatilityAdjustment));
        }
        
        // TRUE probability that price will be BELOW this level
        const trueProbBelow = 1 - trueProbAbove;
        
        // Use Black-Scholes-inspired pricing
        const marketPriceYes = calculateBinaryOptionPrice(btcPrice, price, timeToExpiry);
        const marketPriceNo = 1 - marketPriceYes;
        
        // Calculate edge for YES bet
        const edgeYes = adjustEdgeForExtremes(Math.abs(trueProbAbove - marketPriceYes) * 100, marketPriceYes);
        const isSaturatedYes = marketPriceYes > 0.95 || marketPriceYes < 0.05;
        
        // Calculate edge for NO bet
        const edgeNo  = adjustEdgeForExtremes(Math.abs(trueProbBelow - marketPriceNo) * 100, marketPriceNo);
        const isSaturatedNo = marketPriceNo > 0.95 || marketPriceNo < 0.05;
        
        // Calculate profit potential based on edge + price movement opportunity
        let profitPotentialYes = 0;
        let profitPotentialNo = 0;

        if (isPriceRising) {
          // Rising: YES contracts below current price have best profit potential
          if (price < btcPrice) {
            // Closer to current = can sell sooner at higher price
            // $90,750 YES better than $90,500 YES when at $90,850
            const distanceBelow = btcPrice - price;
            const proximityBonus = Math.max(0, (500 - distanceBelow) / 500); // Bonus for being close
            profitPotentialYes = edgeYes * (1 + proximityBonus * 0.5);
          } else if (price === btcPrice) {
            profitPotentialYes = edgeYes * 1.2; // At-the-money has good potential
          } else {
            // Above current - riskier but still viable
            profitPotentialYes = edgeYes * 0.6;
          }
          // NO contracts less attractive when rising
          profitPotentialNo = edgeNo * 0.4;
          
        } else {
          // Falling: NO contracts above current price have best profit potential
          if (price > btcPrice) {
            const distanceAbove = price - btcPrice;
            const proximityBonus = Math.max(0, (500 - distanceAbove) / 500);
            profitPotentialNo = edgeNo * (1 + proximityBonus * 0.5);
          } else if (price === btcPrice) {
            profitPotentialNo = edgeNo * 1.2;
          } else {
            profitPotentialNo = edgeNo * 0.6;
          }
          // YES contracts less attractive when falling
          profitPotentialYes = edgeYes * 0.4;
        }
        
        // Add YES option
        contractOptions.push({
          price,
          betType: 'YES',
          direction: 'or above',
          trueProb: trueProbAbove,
          marketPrice: marketPriceYes,
          edge: edgeYes,
          profitPotential: profitPotentialYes,
          isSaturated: isSaturatedYes,
          description: `YES: $${price.toLocaleString()} or above`
        });
        
        // Add NO option (betting price will be BELOW)
        contractOptions.push({
          price,
          betType: 'NO',
          direction: 'below',
          trueProb: trueProbBelow,
          marketPrice: marketPriceNo,
          edge: edgeNo,
          profitPotential: profitPotentialNo,
          isSaturated: isSaturatedNo,
          description: `NO on $${price.toLocaleString()} or above (= betting BELOW $${price.toLocaleString()})`
        });
      });
      
      // Extend range if highest prices aren't saturated
      const highestYesContract = contractOptions
        .filter(c => c.betType === 'YES')
        .sort((a, b) => b.price - a.price)[0];
          
      if (!highestYesContract.isSaturated && highestYesContract.marketPrice < 0.95) {
        // Add 2 more levels above
        for (let i = 1; i <= 2; i++) {
          const newPrice = priceLevels[priceLevels.length - 1] + (BASE_INCREMENT * i);
          const distance = newPrice - btcPrice;
          const volatilityAdjustment = Math.abs(distance) / 500;
          const trueProbAbove = Math.max(0.01, (avgModel / 100) * Math.exp(-volatilityAdjustment));
          const trueProbBelow = 1 - trueProbAbove;
          
          const marketPriceYes = calculateBinaryOptionPrice(btcPrice, newPrice, timeToExpiry);
          const marketPriceNo = 1 - marketPriceYes;
          
          let edgeYes = Math.abs(trueProbAbove - marketPriceYes) * 100;
          let edgeNo  = Math.abs(trueProbBelow - marketPriceNo) * 100;

          //  extreme-price compression
          edgeYes = adjustEdgeForExtremes(edgeYes, marketPriceYes);
          edgeNo  = adjustEdgeForExtremes(edgeNo, marketPriceNo);
          const isSaturatedYes = marketPriceYes > 0.95 || marketPriceYes < 0.05;
          const isSaturatedNo = marketPriceNo > 0.95 || marketPriceNo < 0.05;
          
          let profitPotentialYes = edgeYes * 0.6;
          let profitPotentialNo = edgeNo * 0.4;
          
          contractOptions.push({
            price: newPrice,
            betType: 'YES',
            direction: 'or above',
            trueProb: trueProbAbove,
            marketPrice: marketPriceYes,
            edge: edgeYes,
            profitPotential: profitPotentialYes,
            isSaturated: isSaturatedYes,
            description: `YES: $${newPrice.toLocaleString()} or above`
          });
          
          contractOptions.push({
            price: newPrice,
            betType: 'NO',
            direction: 'below',
            trueProb: trueProbBelow,
            marketPrice: marketPriceNo,
            edge: edgeNo,
            profitPotential: profitPotentialNo,
            isSaturated: isSaturatedNo,
            description: `NO on $${newPrice.toLocaleString()} or above (= betting BELOW $${newPrice.toLocaleString()})`
          });
        }
      }
      
      // Find best opportunity (highest PROFIT POTENTIAL that's not saturated)
      const validContracts = contractOptions.filter(c => !c.isSaturated && c.edge > 3);
      const bestContract = validContracts.reduce((best, current) => 
        current.profitPotential > best.profitPotential ? current : best
      , validContracts[0] || contractOptions[0]);
      
      // Calculate confidence based on model agreement and edge
      const modelAgreement = 100 - Math.abs(lstm - xgb);
      const patterns = detectPatterns();
      const patternConfidence = Math.min(20, patterns.length * 5);
      const baseConfidence = (modelAgreement * 0.6) + (patternConfidence * 0.4);
      const finalConfidence = Math.min(95, baseConfidence + bestContract.edge * 0.5);
      
      // Calculate position size
      const maxBet = bankroll * 0.5;
      const edgeMultiplier = Math.min(1.5, 1 + bestContract.edge / 50);
      const positionSize = Math.round((finalConfidence / 100) * maxBet * edgeMultiplier);
      
      // Calculate expected value
      const payout = 1; // $1 per contract if correct
      const cost = bestContract.marketPrice;
      const expectedValue = (bestContract.trueProb * payout - cost) * positionSize;

      setSignals({
        recommendation: bestContract.edge > 10 ? 'BUY' : bestContract.edge > 5 ? 'SMALL BUY' : 'WAIT',
        contract: bestContract.description,
        betType: bestContract.betType,
        targetPrice: bestContract.price,
        direction: bestContract.direction,
        confidence: Math.round(finalConfidence),
        positionSize,
        expectedValue: expectedValue.toFixed(2),
        lstm,
        xgb,
        marketPrice: (bestContract.marketPrice * 100).toFixed(0),
        impliedProb: (bestContract.marketPrice * 100).toFixed(0),
        edge: bestContract.edge.toFixed(1),
        profitPotential: bestContract.profitPotential.toFixed(1),
        patterns,
        indicators,
        strategy: timeToExpiry > 30 ? 'Enter position' : timeToExpiry > 15 ? 'Hold and monitor' : 'Prepare to exit or hold through expiry',
        allContracts: contractOptions // Store all options for display
      });
    };

    calculateSignals();
    const interval = setInterval(calculateSignals, 30000); // Recalculate every 1 minute
    return () => clearInterval(interval);
    }, [priceHistory.length, btcPrice, indicators, bankroll, timeToExpiry, customMarketPrices]);

  // Handle market price editing
  const handleEditMarketPrice = (price, betType) => {
    const contract = signals?.allContracts?.find(c => c.price === price && c.betType === betType);
    if (contract) {
      setEditingPrice({
        price,
        betType,
        value: (contract.marketPrice * 100).toFixed(0)
      });
    }
  };

  const handleSaveMarketPrice = () => {
    if (editingPrice && signals) {
      const centsValue = parseInt(editingPrice.value);
      if (centsValue >= 1 && centsValue <= 99) {
        const decimalValue = centsValue / 100;
        const customKey = `${editingPrice.price}-5`; // Using baseDecayRate 5 as key
        
        // Save the custom price
        setCustomMarketPrices(prev => ({
          ...prev,
          [customKey]: decimalValue
        }));
        
        // Update the opposite bet type automatically
        const oppositeBetType = editingPrice.betType === 'YES' ? 'NO' : 'YES';
        const oppositeKey = `${editingPrice.price}-5`;
        const oppositeValue = 1 - decimalValue;
        
        setCustomMarketPrices(prev => ({
          ...prev,
          [oppositeKey]: oppositeValue
        }));
        
        setEditingPrice(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
  };

  const handleBankrollSave = () => {
    const value = parseFloat(bankrollInput);
    if (!isNaN(value) && value >= 0) {
      setBankroll(value);
      setIsBankrollEditing(false);
    }
  };

  const handleBankrollCancel = () => {
    setBankrollInput(bankroll.toString());
    setIsBankrollEditing(false);
  };

  // Confidence stars
  const getConfidenceStars = (confidence) => {
    const stars = Math.round(confidence / 20);
    return '⭐'.repeat(stars);
  };

  // Color coding
  const getRecommendationColor = (rec) => {
    if (rec === 'BUY') return 'text-green-600 bg-green-50';
    if (rec === 'SMALL BUY') return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (loading || !signals) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading BTC data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
        <style jsx global>{`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .modal-content {
            background: #1f2937;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid #374151;
            max-width: 400px;
            width: 90%;
            z-index: 1001;
        }
        `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">BTC Prediction Market Arbitrage Bot</h1>
          <p className="text-gray-400">Exploit mispricing, not just price prediction</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current BTC</span>
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold mt-2">${btcPrice.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bankroll</span>
              <div className="flex items-center space-x-2">
                {isBankrollEditing ? (
                  <>
                    <input
                      type="number"
                      value={bankrollInput}
                      onChange={(e) => setBankrollInput(e.target.value)}
                      className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                      step="1"
                      min="0"
                    />
                    <button
                      onClick={handleBankrollSave}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleBankrollCancel}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <DollarSign className="text-blue-500" size={20} />
                    <button
                      onClick={() => setIsBankrollEditing(true)}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      <Edit size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold mt-2">${bankroll.toFixed(2)}</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Time to Expiry</span>
              <Clock className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold mt-2">{timeToExpiry}m</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profit Score</span>
              <Zap className="text-purple-500" size={20} />
            </div>
            <div className="text-2xl font-bold mt-2">{signals.profitPotential}</div>
          </div>
        </div>

        {/* Market Price Editor Modal */}
        {editingPrice && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h3 className="text-xl font-bold mb-4">Edit Market Price</h3>
            <div className="mb-4">
                <p className="text-gray-300 mb-2">
                Editing {editingPrice.betType} contract at ${editingPrice.price.toLocaleString()} or above
                </p>
                <div className="flex items-center space-x-2">
                <input
                    type="number"
                    value={editingPrice.value}
                    onChange={(e) => setEditingPrice({...editingPrice, value: e.target.value})}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    min="1"
                    max="99"
                    placeholder="Enter cents (1-99)"
                    autoFocus
                />
                <span className="text-gray-400">¢</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                Note: NO contract price will automatically update to {100 - parseInt(editingPrice.value) || '...'}¢
                </p>
            </div>
            <div className="flex justify-end space-x-3">
                <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                Cancel
                </button>
                <button
                onClick={handleSaveMarketPrice}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                >
                Save Changes
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Main Signal Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg border-2 border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🎯 SIGNAL FOR NEXT HOUR CONTRACT</h2>
            <div className="text-sm text-gray-400">Updated: {new Date().toLocaleTimeString()}</div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div>
                <div className={`inline-block px-4 py-2 rounded-lg font-bold text-lg mb-4 ${getRecommendationColor(signals.recommendation)}`}>
                  📊 {signals.recommendation}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Contract:</span>
                    <div className="text-xl font-bold">
                      <span className={`px-3 py-1 rounded ${signals.betType === 'YES' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {signals.betType}
                      </span>
                      {' '}${signals.targetPrice.toLocaleString()} or above
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {signals.betType === 'YES' 
                        ? `Betting price will be ≥ $${signals.targetPrice.toLocaleString()}`
                        : `Betting price will be < $${signals.targetPrice.toLocaleString()}`
                      }
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <div className="text-xl font-bold">
                      {signals.confidence}% {getConfidenceStars(signals.confidence)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Position Size:</span>
                    <div className="text-xl font-bold text-green-400">
                      ${signals.positionSize} ({((signals.positionSize / bankroll) * 100).toFixed(1)}% of bankroll)
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Expected Value:</span>
                    <div className={`text-xl font-bold ${parseFloat(signals.expectedValue) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(signals.expectedValue) > 0 ? '+' : ''}${signals.expectedValue}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 className="font-bold mb-3">🧠 Model Predictions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>LSTM Model:</span>
                    <span className="font-bold">{signals.lstm.toFixed(1)}% bullish</span>
                  </div>
                  <div className="flex justify-between">
                    <span>XGBoost Model:</span>
                    <span className="font-bold">{signals.xgb.toFixed(1)}% bullish</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span>Market Price:</span>
                    <span className="font-bold">{signals.marketPrice}¢</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Implied Probability:</span>
                    <span className="font-bold">{signals.impliedProb}%</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2">
                    <span className="text-yellow-400">🎯 EDGE:</span>
                    <span className="font-bold text-yellow-400">+{signals.edge}% mispricing!</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-400">⚡ PROFIT SCORE:</span>
                    <span className="font-bold text-purple-400">{signals.profitPotential}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-700">
                  <div className="text-sm">
                    <span className="font-bold">💡 Strategy: </span>
                    {signals.strategy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Available Contracts */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">💰 All Available Contracts (Sorted by Profit Potential)</h3>
            <div className="text-sm text-gray-400">
              Click <Edit size={16} className="inline ml-1" /> to edit market prices
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Contract</th>
                  <th className="text-right py-2">Market Price</th>
                  <th className="text-right py-2">Model Prob</th>
                  <th className="text-right py-2">Edge</th>
                  <th className="text-right py-2">Profit Score</th>
                  <th className="text-right py-2">Status</th>
                  <th className="text-right py-2">Edit</th>
                </tr>
              </thead>
              <tbody>
                {signals.allContracts
                  .filter(c => !c.isSaturated)
                  .sort((a, b) => b.profitPotential - a.profitPotential)
                  .map((contract, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-gray-700 ${
                        contract.price === signals.targetPrice && contract.betType === signals.betType 
                          ? 'bg-green-900/20' 
                          : ''
                      }`}
                    >
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                          contract.betType === 'YES' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {contract.betType}
                        </span>
                        ${contract.price.toLocaleString()} or above
                      </td>
                      <td className="text-right">
                        {(contract.marketPrice * 100).toFixed(0)}¢
                      </td>
                      <td className="text-right">{(contract.trueProb * 100).toFixed(1)}%</td>
                      <td className={`text-right font-bold ${
                        contract.edge > 10 ? 'text-green-400' : 
                        contract.edge > 5 ? 'text-yellow-400' : 
                        'text-gray-400'
                      }`}>
                        {contract.edge.toFixed(1)}%
                      </td>
                      <td className={`text-right font-bold ${
                        contract.profitPotential > 15 ? 'text-green-400' : 
                        contract.profitPotential > 8 ? 'text-yellow-400' : 
                        'text-gray-400'
                      }`}>
                        {contract.profitPotential.toFixed(1)}
                      </td>
                      <td className="text-right">
                        {contract.isSaturated ? (
                          <span className="text-gray-500">Saturated</span>
                        ) : contract.price === signals.targetPrice && contract.betType === signals.betType ? (
                          <span className="text-green-400 font-bold">⭐ BEST</span>
                        ) : contract.profitPotential > 8 ? (
                          <span className="text-yellow-400">Good</span>
                        ) : (
                        <span className="text-gray-400">Wait</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleEditMarketPrice(contract.price, contract.betType)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Edit market price"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                ))}
            </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>💡 <strong>Note:</strong> When you edit a YES contract price, the NO contract price at the same strike will automatically update to maintain the relationship (YES + NO = 100¢).</p>
            <p className="mt-1">Custom prices are saved and will override calculated prices. Refresh the page to reset to calculated prices.</p>
          </div>
        </div>

        {/* Technical Analysis */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Chart */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold mb-4">📈 Price Chart (Last 5 min)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} />
                <ReferenceLine y={signals.indicators.supportLevel} stroke="#EF4444" strokeDasharray="3 3" label="Support" />
                <ReferenceLine y={signals.indicators.resistanceLevel} stroke="#10B981" strokeDasharray="3 3" label="Resistance" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Indicators */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold mb-4">📊 Technical Indicators</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">RSI</span>
                  <span className="text-sm font-bold">{signals.indicators.rsi.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${signals.indicators.rsi > 70 ? 'bg-red-500' : signals.indicators.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'}`}
                    style={{ width: `${signals.indicators.rsi}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">MACD</span>
                  <span className="text-sm font-bold">{signals.indicators.macd.toFixed(2)}</span>
                </div>
                <div className={`text-xs ${signals.indicators.macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {signals.indicators.macd > 0 ? '↑ Bullish' : '↓ Bearish'}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Volume</span>
                  <span className="text-sm font-bold">{signals.indicators.volume.toFixed(2)}x</span>
                </div>
                {signals.indicators.volume > 1.2 && (
                  <div className="text-xs text-yellow-400">⚡ Volume surge detected</div>
                )}
              </div>

              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Support:</span>
                  <span className="font-bold text-red-400">${signals.indicators.supportLevel.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Resistance:</span>
                  <span className="font-bold text-green-400">${signals.indicators.resistanceLevel.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patterns Detected */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-4">🔍 Chart Patterns Detected</h3>
          <div className="grid grid-cols-3 gap-3">
            {signals.patterns.length > 0 ? (
              signals.patterns.map((pattern, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg ${pattern.bullish ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}
                >
                  <div className="flex items-center">
                    {pattern.bullish ? <TrendingUp size={16} className="mr-2" /> : <TrendingDown size={16} className="mr-2" />}
                    <span className="text-sm">{pattern.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No strong patterns detected</div>
            )}
          </div>
        </div>

        {/* Position Tracker */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-3">📝 Position Tracker</h3>
          <div className="space-y-2">
            <button 
              onClick={() => {
                if (signals.recommendation !== 'WAIT') {
                  setCurrentPosition({
                    contract: signals.contract,
                    entry: signals.marketPrice,
                    size: signals.positionSize,
                    entryTime: new Date().toLocaleTimeString()
                  });
                  setBankroll(prev => prev - signals.positionSize);
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-2"
            >
              Enter Position (${signals.positionSize})
            </button>
            
            {currentPosition && (
              <div className="mt-3 p-3 bg-blue-900/30 rounded border border-blue-700">
                <div className="text-sm">
                  <div>Active: {currentPosition.contract}</div>
                  <div>Entry: {currentPosition.entryTime}</div>
                  <div>Size: ${currentPosition.size}</div>
                </div>
                <button 
                  onClick={() => {
                    // Simulate exit
                    const profit = Math.random() > 0.5 ? currentPosition.size * 0.5 : -currentPosition.size * 0.5;
                    setBankroll(prev => prev + currentPosition.size + profit);
                    setCurrentPosition(null);
                  }}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded mt-2 text-sm"
                >
                  Exit Position
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BTCPredictionTrader;