import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, TrendingUp, Activity, AlertCircle, Brain, Target, CheckCircle } from 'lucide-react';

export default function NikolasCompleteAlgorithmBot() {
  const [apiToken, setApiToken] = useState('');
  const [accountType, setAccountType] = useState('demo');
  const [isConnected, setIsConnected] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [accountInfo, setAccountInfo] = useState(null);
  const [profit, setProfit] = useState(0);
  const [ticks, setTicks] = useState([]);
  const [analysis, setAnalysis] = useState({ 
    signal: 'WAIT', 
    confidence: 'low', 
    laws: {},
    agreementCount: 0,
    reasoning: [] 
  });
  const [trades, setTrades] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    symbol: 'R_100',
    tradeAmount: 1,
    tradeDuration: 7,
    durationUnit: 't',
    maxTrades: 20,
    targetProfit: 20,
    stopLoss: 30,
    minAgreementLaws: 3,
    analysisWindow: 5,
    useMartingale: false,
    martingaleMultiplier: 2,
    maxMartingaleSteps: 3,
    martingaleStartFrom: 'loss',
    martingaleResetOnWin: true,
    lawAgreementMode: 'balanced'
  });
  
  const lawAgreementModes = {
    aggressive: { min: 1, max: 2, label: '🔥 Aggressive (1-2 Laws)', description: 'High risk, more trades' },
    balanced: { min: 3, max: 4, label: '⚖️ Balanced (3-4 Laws)', description: 'Recommended, good risk/reward' },
    safe: { min: 5, max: 7, label: '🛡️ Safe (5-7 Laws)', description: 'Low risk, fewer trades' }
  };
  
  const [martingaleState, setMartingaleState] = useState({
    currentStep: 0,
    currentAmount: 1,
    inMartingaleSequence: false
  });

  // ===== COOLDOWN SYSTEM =====
  const [cooldownSettings, setCooldownSettings] = useState({
    isActive: false,
    durationSeconds: 0,
    selectedDuration: 60, // default 1 minute
    autoCooldownOnTakeProfit: false,
    autoCooldownDuration: 60 // duration to use when auto-triggered
  });

  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  // ===== BOT HEALTH MONITORING SYSTEM =====
  const [botHealth, setBotHealth] = useState({
    status: 'disconnected', // 'running', 'slow', 'frozen', 'disconnected'
    ticksPerSecond: 0,
    lastTickTime: null,
    timeSinceLastTick: 0,
    isMonitoring: false
  });

  // ===== GOOGLE SHEETS CONFIGURATION =====
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState({
    webhookUrl: localStorage.getItem('googleSheetsWebhook') || 'https://script.googleapis.com/macros/d/1T6FAJ-u62H6jqN_AGfYc1Y2cP3NcEZcbK_z9z9AKfycbyaZebZpJJALWghXT8Wohqq2ux00pfupSIuaRjFG5xsLpcG44936wX7pM2S0vFfAhOA/usercontent'
  });

  // ===== TRADE ANALYTICS SYSTEM =====
  const [tradeAnalytics, setTradeAnalytics] = useState({
    totalTrades: 0,
    winTrades: [],
    lossTrades: [],
    lawPatterns: {}, // Track which law combinations lead to wins
    marketConditionPatterns: {}, // Track market conditions during wins
    bestTimeToTrade: {}, // Track best hours/conditions
    winRateByLaws: {}, // Win rate per law combination
    consecutiveWins: 0,
    consecutiveLosses: 0,
    maxConsecutiveWins: 0
  });

  // ===== LAW WEIGHTS ADAPTIVE SYSTEM =====
  const [lawWeights, setLawWeights] = useState({
    numericalValue: 1.0,
    sequentialValue: 1.0,
    valueDirection: 1.0,
    characterPressure: 1.0,
    correctionValue: 1.0,
    differenceOneUnit: 1.0,
    reversalByNine: 1.0
  });

  const [lawStats, setLawStats] = useState({
    numericalValue: { wins: 0, losses: 0, calls: 0, puts: 0 },
    sequentialValue: { wins: 0, losses: 0, calls: 0, puts: 0 },
    valueDirection: { wins: 0, losses: 0, calls: 0, puts: 0 },
    characterPressure: { wins: 0, losses: 0, calls: 0, puts: 0 },
    correctionValue: { wins: 0, losses: 0, calls: 0, puts: 0 },
    differenceOneUnit: { wins: 0, losses: 0, calls: 0, puts: 0 },
    reversalByNine: { wins: 0, losses: 0, calls: 0, puts: 0 }
  });

  // ===== SESSION TRACKING SYSTEM =====
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState({
    sessionNumber: 1,
    startTime: Date.now(),
    endReason: null, // 'take-profit', 'stop-loss', 'running'
    winTrades: 0,
    lossTrades: 0,
    totalProfit: 0,
    totalTrades: 0,
    winRate: 0
  });

  const analyticsRef = useRef(tradeAnalytics);
  
  const wsRef = useRef(null);
  const settingsRef = useRef(null);
  const isTradingRef = useRef(false);
  const profitRef = useRef(0);
  const martingaleStateRef = useRef({ currentStep: 0, currentAmount: 1, inMartingaleSequence: false });
  const tickSubscriptionRef = useRef(null);
  const tradeCountRef = useRef(0);
  const activeContractsRef = useRef([]);
  const lastExecutionTimeRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const tradeEntryDataRef = useRef({}); // Store entry data for each contract
  const cooldownIntervalRef = useRef(null); // Cooldown countdown interval
  const cooldownSettingsRef = useRef({ isActive: false, durationSeconds: 0, selectedDuration: 60, autoCooldownOnTakeProfit: false, autoCooldownDuration: 60 });
  const lastTargetProfitResetRef = useRef(0); // Track when we last hit take-profit to avoid re-triggering
  
  // Health monitoring refs
  const lastTickTimeRef = useRef(null);
  const tickCountRef = useRef(0);
  const healthCheckIntervalRef = useRef(null);
  const healthMonitoringEnabledRef = useRef(false);
  const frozenRestartCountRef = useRef(0);
  const disconnectedRestartCountRef = useRef(0);

  // Session tracking refs
  const sessionCounterRef = useRef(1);
  const sessionStartTimeRef = useRef(Date.now());
  const sessionWinsRef = useRef(0);
  const sessionLossesRef = useRef(0);
  const sessionTotalTradesRef = useRef(0);
  
  // Law weights and analytics refs
  const lawWeightsRef = useRef(lawWeights);
  const lawStatsRef = useRef(lawStats);
  const lastTradeAnalysisRef = useRef(null); // Store last trade signal/laws for learning

  const getLastDigit = (price) => {
    const priceStr = price.toString();
    return parseInt(priceStr[priceStr.length - 1]);
  };

  const isOdd = (num) => num % 2 !== 0;
  const isEven = (num) => num % 2 === 0;

  // ===== LAW WEIGHT ADAPTATION FUNCTIONS =====
  const updateLawWeights = (lawsUsed, tradeWon) => {
    const updatedStats = { ...lawStatsRef.current };
    const updatedWeights = { ...lawWeightsRef.current };
    
    // Update stats for each law that participated
    Object.keys(lawsUsed).forEach(lawName => {
      if (lawsUsed[lawName] !== 'WAIT') {
        if (!updatedStats[lawName]) {
          updatedStats[lawName] = { wins: 0, losses: 0, calls: 0, puts: 0 };
        }
        
        if (tradeWon) {
          updatedStats[lawName].wins++;
        } else {
          updatedStats[lawName].losses++;
        }
        
        if (lawsUsed[lawName] === 'CALL') {
          updatedStats[lawName].calls++;
        } else if (lawsUsed[lawName] === 'PUT') {
          updatedStats[lawName].puts++;
        }
        
        // Calculate win rate
        const totalTrades = updatedStats[lawName].wins + updatedStats[lawName].losses;
        const winRate = updatedStats[lawName].wins / totalTrades;
        
        // Adjust weight based on win rate
        // Target: 50% win rate = 1.0x weight
        // 60% win rate = 1.2x weight
        // 40% win rate = 0.8x weight
        updatedWeights[lawName] = Math.max(0.5, Math.min(2.0, winRate * 2));
      }
    });
    
    lawStatsRef.current = updatedStats;
    lawWeightsRef.current = updatedWeights;
    setLawStats(updatedStats);
    setLawWeights(updatedWeights);
    
    // Log learning
    if (Object.keys(lawsUsed).length > 0) {
      const logMsg = Object.entries(updatedWeights)
        .slice(0, 3) // Show first 3 laws
        .map(([law, weight]) => `${law}: ${weight.toFixed(2)}x`)
        .join(' | ');
      addLog(`📚 Law Weights Updated: ${logMsg}`, 'info');
    }
  };

  // ===== SESSION MANAGEMENT =====
  const saveSession = (endReason, profit) => {
    const sessionData = {
      sessionNumber: sessionCounterRef.current,
      startTime: sessionStartTimeRef.current,
      endTime: Date.now(),
      endReason: endReason, // 'take-profit' or 'stop-loss'
      winTrades: sessionWinsRef.current,
      lossTrades: sessionLossesRef.current,
      totalTrades: sessionTotalTradesRef.current,
      totalProfit: profit,
      winRate: sessionTotalTradesRef.current > 0 
        ? (sessionWinsRef.current / sessionTotalTradesRef.current * 100).toFixed(2) 
        : 0
    };
    
    setSessions(prev => [...prev, sessionData]);
    addLog(`📊 SESSION #${sessionCounterRef.current} COMPLETED | Reason: ${endReason} | Profit: $${profit.toFixed(2)} | W/L: ${sessionWinsRef.current}/${sessionLossesRef.current}`, 'success');
    
    // Reset session counters
    sessionCounterRef.current++;
    sessionStartTimeRef.current = Date.now();
    sessionWinsRef.current = 0;
    sessionLossesRef.current = 0;
    sessionTotalTradesRef.current = 0;
    
    // Update current session display
    setCurrentSession({
      sessionNumber: sessionCounterRef.current,
      startTime: Date.now(),
      endReason: null,
      winTrades: 0,
      lossTrades: 0,
      totalProfit: 0,
      totalTrades: 0,
      winRate: 0
    });
  };

  // ===== INDICATOR FUNCTIONS =====

  const analyzeCompleteAlgorithm = (digitSequence) => {
    if (digitSequence.length < 4) {
      return { 
        signal: 'WAIT', 
        confidence: 'low', 
        laws: {},
        agreementCount: 0,
        reasoning: ['Need at least 4 ticks for analysis'] 
      };
    }

    const reasoning = [];
    const laws = {};
    const windowSize = Math.min(settings.analysisWindow, digitSequence.length);
    const digits = digitSequence.slice(-windowSize);
    
    reasoning.push(`📊 Analyzing ${digits.length} ticks: ${digits.map(d => d.digit).join(' ')}`);

    let startIndex = -1;
    for (let i = 0; i < digits.length - 1; i++) {
      const current = digits[i].digit;
      const next = digits[i + 1].digit;
      if ((isOdd(current) && isEven(next)) || (isEven(current) && isOdd(next))) {
        startIndex = i;
        reasoning.push(`✅ START point found: ${current} meets ${next}`);
        break;
      }
    }

    if (startIndex === -1) {
      return { 
        signal: 'WAIT', 
        confidence: 'low', 
        laws: {},
        agreementCount: 0,
        reasoning: ['⏳ No START point - waiting for ODD to meet EVEN'] 
      };
    }

    const analysisDigits = digits.slice(startIndex);
    
    const oddDigits = analysisDigits.filter(d => isOdd(d.digit));
    const evenDigits = analysisDigits.filter(d => isEven(d.digit));

    laws.numericalValue = analyzeNumericalValue(analysisDigits, reasoning);
    laws.sequentialValue = analyzeSequentialValue(analysisDigits, reasoning);
    laws.valueDirection = analyzeValueDirection(oddDigits, evenDigits, reasoning);
    laws.characterPressure = analyzeCharacterPressure(analysisDigits, reasoning);
    laws.correctionValue = analyzeCorrectionValue(analysisDigits, reasoning);
    laws.differenceOneUnit = analyzeDifferenceOneUnit(oddDigits, evenDigits, reasoning);
    laws.reversalByNine = analyzeReversalByNine(analysisDigits, reasoning);

    const signals = Object.values(laws).filter(law => law !== 'WAIT');
    const callCount = signals.filter(s => s === 'CALL').length;
    const putCount = signals.filter(s => s === 'PUT').length;
    const agreementCount = Math.max(callCount, putCount);
    
    reasoning.push(`\n📈 CALL signals: ${callCount} | 📉 PUT signals: ${putCount}`);

    let finalSignal = 'WAIT';
    let confidence = 'low';

    if (agreementCount >= settings.minAgreementLaws) {
      finalSignal = callCount > putCount ? 'CALL' : 'PUT';
      
      if (agreementCount >= 5) {
        confidence = 'high';
        reasoning.push(`\n🎯 STRONG AGREEMENT: ${agreementCount} laws agree → ${finalSignal}`);
      } else if (agreementCount >= 4) {
        confidence = 'medium';
        reasoning.push(`\n✓ GOOD AGREEMENT: ${agreementCount} laws agree → ${finalSignal}`);
      } else {
        confidence = 'medium';
        reasoning.push(`\n⚠️ MINIMUM AGREEMENT: ${agreementCount} laws agree → ${finalSignal}`);
      }
    } else {
      reasoning.push(`\n⏸️ INSUFFICIENT AGREEMENT: Only ${agreementCount} laws agree (need ${settings.minAgreementLaws})`);
    }

    return { signal: finalSignal, confidence, laws, agreementCount, reasoning };
  };

  const analyzeNumericalValue = (digits, reasoning) => {
    reasoning.push('\n📊 LAW 1: Numerical Value');
    
    if (digits.length < 4) return 'WAIT';

    const highestBlue = Math.max(...digits.filter(d => d.color === 'blue').map(d => d.digit), -1);
    const highestRed = Math.max(...digits.filter(d => d.color === 'red').map(d => d.digit), -1);

    if (highestBlue > highestRed) {
      reasoning.push(`  Highest Blue (${highestBlue}) > Highest Red (${highestRed}) → CALL`);
      return 'CALL';
    } else if (highestRed > highestBlue) {
      reasoning.push(`  Highest Red (${highestRed}) > Highest Blue (${highestBlue}) → PUT`);
      return 'PUT';
    }
    
    reasoning.push(`  Values equal → WAIT`);
    return 'WAIT';
  };

  const analyzeSequentialValue = (digits, reasoning) => {
    reasoning.push('\n📈 LAW 2: Sequential Value');
    
    if (digits.length < 3) return 'WAIT';

    let rises = 0, falls = 0;
    
    for (let i = 1; i < digits.length; i++) {
      if (digits[i].digit > digits[i-1].digit) rises++;
      if (digits[i].digit < digits[i-1].digit) falls++;
    }

    if (rises > falls) {
      reasoning.push(`  Sequential rises (${rises}) > falls (${falls}) → CALL`);
      return 'CALL';
    } else if (falls > rises) {
      reasoning.push(`  Sequential falls (${falls}) > rises (${rises}) → PUT`);
      return 'PUT';
    }

    reasoning.push(`  No clear sequential trend → WAIT`);
    return 'WAIT';
  };

  const analyzeValueDirection = (oddDigits, evenDigits, reasoning) => {
    reasoning.push('\n🎯 LAW 3: Value Direction');
    
    if (oddDigits.length < 2 || evenDigits.length < 2) {
      reasoning.push(`  Need at least 2 odd and 2 even → WAIT`);
      return 'WAIT';
    }

    const oddDirection = getDirection(oddDigits);
    const evenDirection = getDirection(evenDigits);

    reasoning.push(`  ODD: ${oddDirection}, EVEN: ${evenDirection}`);

    if (oddDirection === 'UP' && evenDirection === 'UP') {
      reasoning.push(`  Both UP → CALL`);
      return 'CALL';
    } else if (oddDirection === 'DOWN' && evenDirection === 'DOWN') {
      reasoning.push(`  Both DOWN → PUT`);
      return 'PUT';
    }

    reasoning.push(`  Directions conflict → WAIT`);
    return 'WAIT';
  };

  const getDirection = (digitArray) => {
    if (digitArray.length < 2) return 'FLAT';
    const first = digitArray[0].digit;
    const last = digitArray[digitArray.length - 1].digit;
    if (last > first) return 'UP';
    if (last < first) return 'DOWN';
    return 'FLAT';
  };

  const analyzeCharacterPressure = (digits, reasoning) => {
    reasoning.push('\n💪 LAW 4: Character Pressure');
    
    if (digits.length < 4) return 'WAIT';

    let highestOdd = { digit: -1, color: '' };
    let highestEven = { digit: -1, color: '' };

    for (const d of digits) {
      if (isOdd(d.digit) && d.digit > highestOdd.digit) {
        highestOdd = d;
      }
      if (isEven(d.digit) && d.digit > highestEven.digit) {
        highestEven = d;
      }
    }

    reasoning.push(`  Highest ODD: ${highestOdd.digit}(${highestOdd.color}), Highest EVEN: ${highestEven.digit}(${highestEven.color})`);

    if (highestOdd.digit > highestEven.digit && highestOdd.color === 'blue') {
      reasoning.push(`  ODD pressure (blue) stronger → CALL`);
      return 'CALL';
    } else if (highestEven.digit > highestOdd.digit && highestEven.color === 'blue') {
      reasoning.push(`  EVEN pressure (blue) stronger → CALL`);
      return 'CALL';
    } else if (highestOdd.digit > highestEven.digit && highestOdd.color === 'red') {
      reasoning.push(`  ODD pressure (red) stronger → PUT`);
      return 'PUT';
    } else if (highestEven.digit > highestOdd.digit && highestEven.color === 'red') {
      reasoning.push(`  EVEN pressure (red) stronger → PUT`);
      return 'PUT';
    }

    reasoning.push(`  No clear pressure winner → WAIT`);
    return 'WAIT';
  };

  const analyzeCorrectionValue = (digits, reasoning) => {
    reasoning.push('\n🔄 LAW 5: Correction Value');
    
    if (digits.length < 5) return 'WAIT';

    const lastThree = digits.slice(-3);
    
    const highest = Math.max(...lastThree.map(d => d.digit));
    const highestIndex = lastThree.findIndex(d => d.digit === highest);
    
    if (highestIndex < lastThree.length - 1) {
      const afterHighest = lastThree[highestIndex + 1];
      if (afterHighest.digit < highest) {
        const highestColor = lastThree[highestIndex].color;
        if (highestColor === 'blue') {
          reasoning.push(`  Correction detected: ${highest}(blue) reverses → PUT`);
          return 'PUT';
        } else {
          reasoning.push(`  Correction detected: ${highest}(red) reverses → CALL`);
          return 'CALL';
        }
      }
    }

    reasoning.push(`  No correction pattern → WAIT`);
    return 'WAIT';
  };

  const analyzeDifferenceOneUnit = (oddDigits, evenDigits, reasoning) => {
    reasoning.push('\n⭐ LAW 6: Difference of 1 Unit (GOLDEN)');
    
    if (oddDigits.length === 0 || evenDigits.length === 0) return 'WAIT';

    const lastOdd = oddDigits[oddDigits.length - 1].digit;
    const lastEven = evenDigits[evenDigits.length - 1].digit;
    const diff = Math.abs(lastOdd - lastEven);

    if (diff === 1) {
      reasoning.push(`  ✨ GOLDEN RULE: ${lastEven} and ${lastOdd} differ by 1`);
      if (lastEven > lastOdd) {
        reasoning.push(`  ${lastEven} > ${lastOdd} → CALL`);
        return 'CALL';
      } else {
        reasoning.push(`  ${lastOdd} > ${lastEven} → PUT`);
        return 'PUT';
      }
    }

    reasoning.push(`  No 1-unit difference (diff: ${diff}) → WAIT`);
    return 'WAIT';
  };

  const analyzeReversalByNine = (digits, reasoning) => {
    reasoning.push('\n🔄 LAW 7: Reversal by 9');
    
    if (digits.length < 3) return 'WAIT';

    const lastDigit = digits[digits.length - 1];
    
    if (lastDigit.digit === 9) {
      const hasZeroBefore = digits.slice(0, -1).some(d => d.digit === 0);
      
      if (!hasZeroBefore) {
        reasoning.push(`  ⚠️ 9 at end with no 0 before → REVERSAL`);
        
        const trend = digits[digits.length - 2].color;
        if (trend === 'blue') {
          reasoning.push(`  Previous trend UP → Reversed to PUT`);
          return 'PUT';
        } else {
          reasoning.push(`  Previous trend DOWN → Reversed to CALL`);
          return 'CALL';
        }
      }
    }

    reasoning.push(`  No reversal by 9 → WAIT`);
    return 'WAIT';
  };

  // ===== HYBRID SYSTEM: Market Position Rules =====
  
  const detectDiscreteWorm = (digits) => {
    if (digits.length < 2) return 0;
    
    const lastDigit = digits[digits.length - 1].digit;
    const prevDigit = digits[digits.length - 2].digit;
    
    // Worm 1: Last digit is green (rising)
    // Worm -1: Last digit is red (falling)
    // Worm 0: Neutral
    const lastColor = digits[digits.length - 1].color;
    
    if (lastColor === 'green' || lastColor === 'blue') return 1;
    if (lastColor === 'red') return -1;
    return 0;
  };

  const detectMarketPosition = (digits) => {
    if (digits.length < 10) return null;
    
    // Get last 10 digits for trend analysis
    const recentDigits = digits.slice(-10);
    const firstDigit = recentDigits[0].digit;
    const lastDigit = recentDigits[recentDigits.length - 1].digit;
    
    // Calculate trend
    if (lastDigit < firstDigit) {
      return '0>9'; // Downtrend
    } else if (lastDigit > firstDigit) {
      return '0<9'; // Uptrend
    }
    return 'neutral';
  };

  const analyzeMarketPositionRules = (digits, reasoning) => {
    reasoning.push('\n🎲 MARKET POSITION RULES (Rules 1-2)');
    
    if (digits.length < 10) {
      reasoning.push(`  Need 10+ ticks for market analysis`);
      return { signal: 'WAIT', confidence: 0 };
    }
    
    const marketPos = detectMarketPosition(digits);
    const worm = detectDiscreteWorm(digits);
    const lastDigit = digits[digits.length - 1].digit;
    
    reasoning.push(`  Market: ${marketPos} | Worm: ${worm > 0 ? '1' : worm < 0 ? '-1' : '0'} | Last Digit: ${lastDigit}`);
    
    // Rule 1: Market 0>9 (downtrend), Worm -1, Digit 9 → PUT
    if (marketPos === '0>9' && worm === -1 && lastDigit === 9) {
      reasoning.push(`  ✅ RULE 1 MATCH: 0>9 + Worm-1 + Digit9 → PUT`);
      return { signal: 'PUT', confidence: 0.75 };
    }
    
    // Rule 2: Market 0<9 (uptrend), Worm 1, Digit 9 → CALL
    if (marketPos === '0<9' && worm === 1 && lastDigit === 9) {
      reasoning.push(`  ✅ RULE 2 MATCH: 0<9 + Worm1 + Digit9 → CALL`);
      return { signal: 'CALL', confidence: 0.75 };
    }
    
    reasoning.push(`  No Market Position Rules match`);
    return { signal: 'WAIT', confidence: 0 };
  };

  const getHybridSignal = (nikoalasResult, digits, reasoning) => {
    if (nikoalasResult.signal === 'WAIT') {
      return nikoalasResult;
    }
    
    // Get Market Position Rules signal
    const marketRulesResult = analyzeMarketPositionRules(digits, reasoning);
    const marketPos = detectMarketPosition(digits);
    const worm = detectDiscreteWorm(digits);
    
    reasoning.push(`\n⚙️ DUAL SYSTEM CHECK:`);
    reasoning.push(`  🔹 Dr.Nikolas (7 Laws): ${nikoalasResult.signal} (${nikoalasResult.agreementCount} laws)`);
    reasoning.push(`  🔹 Market Position Rules: ${marketRulesResult.signal} (Conf: ${(marketRulesResult.confidence * 100).toFixed(0)}%)`);
    reasoning.push(`  🔹 Market: ${marketPos} | Worm: ${worm}`);
    
    // Both systems must AGREE on the signal
    if (marketRulesResult.signal !== 'WAIT' && nikoalasResult.signal === marketRulesResult.signal) {
      reasoning.push(`\n✅ BOTH SYSTEMS AGREE → ${nikoalasResult.signal}`);
      reasoning.push(`   This is a STRONG signal! Execute trade.`);
      
      return {
        signal: nikoalasResult.signal,
        confidence: 'very-high',
        agreementCount: nikoalasResult.agreementCount,
        laws: nikoalasResult.laws,
        reasoning: reasoning,
        hybridConfirmed: true,
        marketPosition: marketPos,
        wormState: worm
      };
    } else if (marketRulesResult.signal !== 'WAIT') {
      reasoning.push(`\n⚠️ SYSTEMS DISAGREE: Dr.Nikolas=${nikoalasResult.signal}, Market Rules=${marketRulesResult.signal}`);
      reasoning.push(`   Skipping trade - only trade on agreement`);
      return {
        signal: 'WAIT',
        confidence: 'low',
        agreementCount: 0,
        laws: {},
        reasoning: reasoning,
        hybridConfirmed: false,
        marketPosition: marketPos,
        wormState: worm
      };
    } else {
      reasoning.push(`\n⏸️ Market Position Rules not triggered yet`);
      reasoning.push(`   Waiting for both systems to agree...`);
      return {
        signal: 'WAIT',
        confidence: 'low',
        agreementCount: 0,
        laws: {},
        reasoning: reasoning,
        hybridConfirmed: false
      };
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-100), { message, type, timestamp }]);
  };

  // ===== TRADE ANALYTICS FUNCTIONS =====

  const recordTradeAnalytics = (tradeData, result) => {
    const { signal, lawsAgreed, marketPosition, wormState, confidence, amount, entryTime } = tradeData;
    const { profit, exitTime, status } = result;
    
    const lawKey = lawsAgreed.sort().join(',');
    const marketKey = `${marketPosition}_${wormState}`;
    const hour = new Date(entryTime).getHours();
    
    setTradeAnalytics(prev => {
      const updated = { ...prev };
      updated.totalTrades++;
      
      if (status === 'win') {
        updated.winTrades.push({
          id: Math.random(),
          signal, lawsAgreed, marketPosition, wormState, confidence, amount,
          profit, entryTime, exitTime, lawKey, marketKey, hour
        });
        updated.consecutiveWins++;
        updated.consecutiveLosses = 0;
        updated.maxConsecutiveWins = Math.max(updated.maxConsecutiveWins, updated.consecutiveWins);
      } else {
        updated.lossTrades.push({
          id: Math.random(),
          signal, lawsAgreed, marketPosition, wormState, confidence, amount,
          profit, entryTime, exitTime, lawKey, marketKey, hour
        });
        updated.consecutiveWins = 0;
        updated.consecutiveLosses++;
      }
      
      // Track law patterns
      if (!updated.lawPatterns[lawKey]) {
        updated.lawPatterns[lawKey] = { wins: 0, losses: 0, trades: 0 };
      }
      updated.lawPatterns[lawKey].trades++;
      if (status === 'win') updated.lawPatterns[lawKey].wins++;
      else updated.lawPatterns[lawKey].losses++;
      
      // Track market condition patterns
      if (!updated.marketConditionPatterns[marketKey]) {
        updated.marketConditionPatterns[marketKey] = { wins: 0, losses: 0, trades: 0 };
      }
      updated.marketConditionPatterns[marketKey].trades++;
      if (status === 'win') updated.marketConditionPatterns[marketKey].wins++;
      else updated.marketConditionPatterns[marketKey].losses++;
      
      // Track best times
      if (!updated.bestTimeToTrade[hour]) {
        updated.bestTimeToTrade[hour] = { wins: 0, losses: 0, trades: 0 };
      }
      updated.bestTimeToTrade[hour].trades++;
      if (status === 'win') updated.bestTimeToTrade[hour].wins++;
      else updated.bestTimeToTrade[hour].losses++;
      
      return updated;
    });
    
    // Log detailed analytics
    const overallWinRate = prev.winTrades.length / prev.totalTrades * 100;
    const lawWinRate = prev.lawPatterns[lawKey]?.wins / prev.lawPatterns[lawKey]?.trades * 100;
    
    addLog(`📊 ${status.toUpperCase()}: ${profit > 0 ? '+' : ''}${profit.toFixed(2)} | Laws: ${lawsAgreed.join(',')} | Win Rate: ${overallWinRate.toFixed(1)}%`, 
           status === 'win' ? 'success' : 'error');
  };

  const getBestTradingConditions = () => {
    const analytics = analyticsRef.current;
    
    // Find best law combinations
    const lawRanking = Object.entries(analytics.lawPatterns)
      .filter(([, data]) => data.trades >= 3)
      .map(([laws, data]) => ({
        laws,
        winRate: (data.wins / data.trades) * 100,
        trades: data.trades
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
    
    // Find best market conditions
    const marketRanking = Object.entries(analytics.marketConditionPatterns)
      .filter(([, data]) => data.trades >= 3)
      .map(([condition, data]) => ({
        condition,
        winRate: (data.wins / data.trades) * 100,
        trades: data.trades
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);
    
    return { lawRanking, marketRanking };
  };

  const shouldTradeBasedOnPattern = (lawsAgreed, marketPosition, wormState) => {
    const analytics = analyticsRef.current;
    
    if (analytics.totalTrades < 5) {
      return true; // Trade all signals until we have enough data
    }
    
    const lawKey = lawsAgreed.sort().join(',');
    const marketKey = `${marketPosition}_${wormState}`;
    
    const lawData = analytics.lawPatterns[lawKey];
    const marketData = analytics.marketConditionPatterns[marketKey];
    
    // Only trade if law combination has >50% win rate (with min 3 trades)
    if (lawData && lawData.trades >= 3) {
      const lawWinRate = lawData.wins / lawData.trades;
      if (lawWinRate < 0.50) {
        return false; // Skip this law combination - it loses too often
      }
    }
    
    // Only trade if market condition has >50% win rate (with min 3 trades)
    if (marketData && marketData.trades >= 3) {
      const marketWinRate = marketData.wins / marketData.trades;
      if (marketWinRate < 0.50) {
        return false; // Skip this market condition - it loses too often
      }
    }
    
    return true;
  };

  const testConnection = async () => {
    addLog('🧪 Testing connection to Deriv servers...', 'info');
    
    try {
      const response = await fetch('https://api.deriv.com/ping', { 
        method: 'HEAD',
        mode: 'no-cors',
        timeout: 5000 
      });
      addLog('✅ Can reach Deriv servers via HTTPS', 'success');
    } catch (error) {
      addLog('⚠️ HTTPS test inconclusive (may still connect via WebSocket)', 'warning');
      // Don't fail on this test - WebSocket might still work
    }
    
    if (!window.WebSocket) {
      addLog('❌ Your browser does not support WebSocket!', 'error');
      addLog('💡 Please use Chrome, Firefox, or Edge', 'warning');
      return false;
    }
    
    addLog('✅ Browser supports WebSocket', 'success');
    return true;
  };

  const connectWebSocket = async () => {
    if (!apiToken || apiToken.trim() === '') {
      addLog('❌ Please enter API token', 'error');
      return;
    }

    const canConnect = await testConnection();
    if (!canConnect) {
      addLog('❌ Pre-connection tests failed', 'error');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch (e) {
        console.log('Error closing existing connection:', e);
      }
      wsRef.current = null;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      addLog(`🔌 Connecting to Deriv (${accountType.toUpperCase()})...`, 'info');
      addLog('⏳ Please wait 5-10 seconds...', 'info');
      
      const appId = 1089;
      const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
      
      addLog(`📡 WebSocket URL: ${wsUrl}`, 'info');
      
      try {
        wsRef.current = new WebSocket(wsUrl);
      } catch (e) {
        addLog(`❌ Failed to create WebSocket: ${e.message}`, 'error');
        addLog('💡 Possible causes:', 'warning');
        addLog('  • Browser blocking WebSocket (security settings)', 'warning');
        addLog('  • Corporate firewall blocking wss:// protocol', 'warning');
        addLog('  • Browser extension blocking connection', 'warning');
        addLog('💡 Try: Disable extensions, use Incognito mode', 'info');
        return;
      }
      
      let eventFired = false;
      
      const connectionTimeout = setTimeout(() => {
        if (!eventFired) {
          addLog('⏰ Connection timeout - No response from server', 'error');
          addLog('💡 Possible issues:', 'warning');
          addLog('  • WebSocket port (443) is blocked', 'warning');
          addLog('  • Firewall/Antivirus blocking connection', 'warning');
          addLog('  • ISP blocking WebSocket protocol', 'warning');
          addLog('  • Try using mobile hotspot to test', 'info');
          
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      }, 15000);
      
      wsRef.current.onopen = () => {
        eventFired = true;
        clearTimeout(connectionTimeout);
        addLog('✅ WebSocket connected successfully!', 'success');
        reconnectAttemptsRef.current = 0;
        
        const authPayload = { 
          authorize: apiToken.trim()
        };
        addLog('🔐 Sending authorization...', 'info');
        console.log('Auth payload:', authPayload);
        
        try {
          wsRef.current.send(JSON.stringify(authPayload));
          addLog('📤 Authorization request sent', 'success');
        } catch (e) {
          addLog(`❌ Failed to send authorization: ${e.message}`, 'error');
        }
      };

      wsRef.current.onmessage = (msg) => {
        eventFired = true;
        try {
          const data = JSON.parse(msg.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error, msg.data);
          addLog('⚠️ Error parsing server response', 'warning');
        }
      };

      wsRef.current.onerror = (error) => {
        eventFired = true;
        clearTimeout(connectionTimeout);
        
        console.error('WebSocket error event:', error);
        
        addLog('❌ WebSocket connection error', 'error');
        addLog('🔧 COMMON FIXES:', 'warning');
        addLog('1️⃣ BROWSER ISSUES: Try Chrome Incognito', 'info');
        addLog('2️⃣ NETWORK ISSUES: Disable VPN/Proxy', 'info');
        addLog('3️⃣ TOKEN ISSUES: Generate NEW token on Deriv', 'info');
      };

      wsRef.current.onclose = (event) => {
        eventFired = true;
        clearTimeout(connectionTimeout);
        
        console.log('WebSocket closed. Code:', event.code);
        
        setIsConnected(false);
        setIsTrading(false);
        
        addLog(`🔌 Disconnected (Code: ${event.code})`, 'warning');
        
        if (event.code === 1006 && !event.wasClean && reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current++;
          const delay = 3000 * reconnectAttemptsRef.current;
          addLog(`🔄 Auto-reconnect ${reconnectAttemptsRef.current}/3 in ${delay/1000}s...`, 'info');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
      
    } catch (error) {
      console.error('Connection error:', error);
      addLog(`❌ Exception during connection: ${error.message}`, 'error');
    }
  };

  const handleWebSocketMessage = (data) => {
    if (data.error) {
      console.error('WebSocket error response:', data.error);
      addLog('❌ Error: ' + data.error.message, 'error');
      if (data.error.code === 'InputValidationFailed') {
        addLog('⚠️ Invalid token format or authorization issue. Please check your API token.', 'error');
      }
      return;
    }

    if (data.authorize) {
      setIsConnected(true);
      setBalance(data.authorize.balance);
      setAccountInfo(data.authorize);
      addLog('✅ Authorized - Nikolas Algorithm Active', 'success');
      subscribeTicks();
    }

    if (data.balance) {
      setBalance(data.balance.balance);
    }

    if (data.tick) {
      // Update health monitoring
      lastTickTimeRef.current = Date.now();
      tickCountRef.current++;
      
      const digit = getLastDigit(data.tick.quote);
      const tickColor = Math.random() > 0.5 ? 'blue' : 'red';
      
      const newTick = {
        digit,
        price: data.tick.quote,
        time: new Date().toLocaleTimeString(),
        color: tickColor
      };
      
      setTicks(prev => {
        const updated = [...prev.slice(-15), newTick];
        
        if (updated.length >= 4 && isTradingRef.current) {
          // Get signal from 7 Laws
          const nikoalasResult = analyzeCompleteAlgorithm(updated);
          
          // Apply hybrid dual-system check (7 Laws + Market Position Rules)
          const hybridResult = getHybridSignal(nikoalasResult, updated, nikoalasResult.reasoning);
          
          setAnalysis(hybridResult);
          
          const minLaws = settingsRef.current?.minAgreementLaws || 3;
          const now = Date.now();
          
          // Check if trading should continue BEFORE opening new trades
          const currentProfit = profitRef.current;
          const shouldContinue = currentProfit < settingsRef.current?.targetProfit && 
                                Math.abs(currentProfit) < settingsRef.current?.stopLoss && 
                                tradeCountRef.current < settingsRef.current?.maxTrades;
          
          if (!shouldContinue) {
            if (currentProfit >= settingsRef.current?.targetProfit) {
              addLog('🎯 Target profit reached!', 'success');
              
              // Save session on take-profit
              saveSession('take-profit', currentProfit);
              
              // Auto-trigger cooldown if enabled
              if (cooldownSettingsRef.current?.autoCooldownOnTakeProfit && !cooldownSettingsRef.current?.isActive) {
                const autoCooldownDuration = cooldownSettingsRef.current?.autoCooldownDuration || 60;
                activateCooldown(autoCooldownDuration, true);
                // Reset profit and trade count for next cycle
                setProfit(0);
                profitRef.current = 0;
                tradeCountRef.current = 0;
                setTrades([]);
                lastTargetProfitResetRef.current = Date.now();
                return updated;
              } else {
                addLog('⏸️ Stopping trades (manual cooldown mode)', 'success');
                setIsTrading(false);
              }
            } else if (Math.abs(currentProfit) >= settingsRef.current?.stopLoss) {
              addLog('🛑 Stop loss triggered - stopping trades', 'error');
              
              // Save session on stop-loss
              saveSession('stop-loss', currentProfit);
              setIsTrading(false);
            } else if (tradeCountRef.current >= settingsRef.current?.maxTrades) {
              addLog('📊 Max trades reached - stopping', 'warning');
              setIsTrading(false);
            }
            return updated;
          }
          
          // ONLY open trade if BOTH systems agree (hybridConfirmed = true) AND not in cooldown
          if (hybridResult.signal !== 'WAIT' && hybridResult.hybridConfirmed && 
              activeContractsRef.current.length === 0 && 
              (now - lastExecutionTimeRef.current) > 500) {
            
            // Check if in cooldown period
            if (cooldownSettingsRef.current?.isActive) {
              addLog(`⏳ Signal: ${hybridResult.signal} | Cooldown active - skipping trade (${cooldownTimeLeft}s remaining)`, 'warning');
            } else {
              lastExecutionTimeRef.current = now;
              addLog(`✅ HYBRID SIGNAL CONFIRMED: ${hybridResult.signal} (7 Laws + Market Rules agree!)`, 'success');
              executeTrade(hybridResult.signal, hybridResult);
            }
          } else if (activeContractsRef.current.length > 0) {
            addLog(`⏳ Signal ready but 1 trade active - waiting for completion...`, 'warning');
          }
        }
        
        return updated;
      });
    }

    if (data.buy) {
      const contractId = data.buy.contract_id;
      activeContractsRef.current.push(contractId);
      const amount = settingsRef.current?.useMartingale ? martingaleState.currentAmount : settingsRef.current?.tradeAmount;
      addLog(`✅ Trade #${activeContractsRef.current.length} opened: ${contractId} | Amount: ${amount}`, 'success');
      const newTrade = {
        id: contractId,
        amount: data.buy.buy_price,
        time: new Date().toLocaleTimeString(),
        status: 'pending',
        type: data.buy.longcode?.includes('Rise') ? 'CALL' : 'PUT',
        martingaleStep: settingsRef.current?.useMartingale ? martingaleState.currentStep : 0
      };
      setTrades(prev => [...prev, newTrade]);
      
      wsRef.current.send(JSON.stringify({
        proposal_open_contract: 1,
        contract_id: contractId,
        subscribe: 1
      }));
    }

    if (data.proposal_open_contract) {
      const contract = data.proposal_open_contract;
      if (contract.is_sold) {
        const profitLoss = contract.profit;
        console.log(`📊 CONTRACT CLOSED: ID=${contract.contract_id} | Profit: ${profitLoss} | Is Sold: ${contract.is_sold}`);
        setProfit(prev => prev + profitLoss);
        profitRef.current = profitRef.current + profitLoss;
        
        // Remove from active contracts and reset execution timer
        activeContractsRef.current = activeContractsRef.current.filter(id => id !== contract.contract_id);
        lastExecutionTimeRef.current = 0;
        
        // Update session tracking
        sessionTotalTradesRef.current++;
        if (profitLoss > 0) {
          sessionWinsRef.current++;
        } else {
          sessionLossesRef.current++;
        }
        
        if (settingsRef.current?.useMartingale) {
          if (profitLoss > 0) {
            if (settingsRef.current?.martingaleResetOnWin) {
              addLog(`🎉 WIN: ${profitLoss.toFixed(2)} | Martingale Reset (${activeContractsRef.current.length} active)`, 'success');
              setMartingaleState({
                currentStep: 0,
                currentAmount: settingsRef.current?.tradeAmount,
                inMartingaleSequence: false
              });
            } else {
              addLog(`🎉 WIN: ${profitLoss.toFixed(2)} | Continuing Martingale (${activeContractsRef.current.length} active)`, 'success');
            }
          } else {
            const currentStep = martingaleStateRef.current.currentStep;
            const nextStep = currentStep + 1;
            
            if (nextStep <= settingsRef.current?.maxMartingaleSteps) {
              // Calculate next amount: baseAmount × multiplier^nextStep
              // Step progression: 0=$1, 1=$2, 2=$4, etc.
              const baseAmount = settingsRef.current?.tradeAmount || 1;
              const multiplier = settingsRef.current?.martingaleMultiplier || 2;
              const nextAmount = baseAmount * Math.pow(multiplier, nextStep);
              
              console.log(`🎲 MARTINGALE LOSS: Step ${currentStep}→${nextStep} | Base: $${baseAmount} × ${multiplier}^${nextStep} = $${nextAmount}`);
              addLog(`❌ LOSS: ${profitLoss.toFixed(2)} | Martingale: Step${currentStep}→${nextStep} | $${baseAmount} × ${multiplier}^${nextStep} = $${nextAmount.toFixed(2)} NEXT`, 'error');
              
              setMartingaleState({
                currentStep: nextStep,
                currentAmount: nextAmount,
                inMartingaleSequence: true
              });
            } else {
              addLog(`❌ LOSS: ${profitLoss.toFixed(2)} | ⚠️ Max Martingale (${settingsRef.current?.maxMartingaleSteps} steps) reached - Resetting`, 'error');
              setMartingaleState({
                currentStep: 0,
                currentAmount: settingsRef.current?.tradeAmount,
                inMartingaleSequence: false
              });
            }
          }
        } else {
          addLog(`${profitLoss > 0 ? '🎉 WIN' : '❌ LOSS'}: ${profitLoss.toFixed(2)} (${activeContractsRef.current.length} active)`, 
                 profitLoss > 0 ? 'success' : 'error');
        }
        
        setTrades(prev => prev.map(t => 
          t.id === contract.contract_id 
            ? { ...t, status: profitLoss > 0 ? 'win' : 'loss', profit: profitLoss }
            : t
        ));

        // Record analytics for this trade
        const entryData = tradeEntryDataRef.current['pending'];
        if (entryData) {
          recordTradeAnalytics(entryData, {
            profit: profitLoss,
            exitTime: Date.now(),
            status: profitLoss > 0 ? 'win' : 'loss'
          });
          
          // Update law weights based on trade result
          if (entryData.allLaws) {
            updateLawWeights(entryData.allLaws, profitLoss > 0);
          }
          
          delete tradeEntryDataRef.current['pending'];
        }

        tradeCountRef.current++;
        
        if (!shouldContinueTrading()) {
          setIsTrading(false);
        }
      }
    }
  };

  const subscribeTicks = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const subscribeMsg = {
        ticks: settings.symbol,
        subscribe: 1
      };
      
      try {
        wsRef.current.send(JSON.stringify(subscribeMsg));
        addLog(`📡 Subscribed to ${settings.symbol} ticks`, 'info');
      } catch (error) {
        addLog(`Failed to subscribe to ticks: ${error.message}`, 'error');
      }
    } else {
      addLog('WebSocket not ready. Cannot subscribe to ticks.', 'error');
    }
  };

  const shouldContinueTrading = () => {
    if (tradeCountRef.current >= settings.maxTrades) {
      addLog('Max trades reached', 'warning');
      return false;
    }
    if (profit >= settings.targetProfit) {
      addLog('🎯 Target profit reached!', 'success');
      return false;
    }
    if (Math.abs(profit) >= settings.stopLoss) {
      addLog('🛑 Stop loss triggered', 'error');
      return false;
    }
    return true;
  };

  const executeTrade = (signal, analysisData = null) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('❌ WebSocket not available', 'error');
      return;
    }

    const contractType = signal === 'CALL' ? 'CALL' : 'PUT';
    const tradeAmount = settingsRef.current?.useMartingale ? martingaleStateRef.current.currentAmount : settingsRef.current?.tradeAmount || 1;
    
    const tradeParams = {
      buy: 1,
      price: tradeAmount,
      parameters: {
        amount: tradeAmount,
        basis: 'stake',
        contract_type: contractType,
        currency: 'USD',
        duration: settingsRef.current?.tradeDuration || 7,
        duration_unit: settingsRef.current?.durationUnit || 't',
        symbol: settingsRef.current?.symbol || 'R_100'
      }
    };

    try {
      wsRef.current.send(JSON.stringify(tradeParams));
      const martingaleInfo = settingsRef.current?.useMartingale 
        ? ` (M:Step${martingaleStateRef.current.currentStep})`
        : '';
      console.log(`🎲 TRADE EXECUTED: $${tradeAmount} | Step: ${martingaleStateRef.current.currentStep} | Amount Ref: ${martingaleStateRef.current.currentAmount}`);
      addLog(`⚡ ${contractType} executed: $${tradeAmount.toFixed(2)} stake${martingaleInfo}`, 'success');
      
      // Store entry data for analytics when this trade closes
      if (analysisData) {
        // Get laws that agreed
        const lawsAgreed = Object.entries(analysisData.laws)
          .filter(([, v]) => v === signal)
          .map(([k]) => k);
        
        // Will be filled when we get the contract ID from response
        tradeEntryDataRef.current['pending'] = {
          signal,
          lawsAgreed,
          allLaws: analysisData.laws, // Store all law results for learning
          marketPosition: analysisData.marketPosition || 'unknown',
          wormState: analysisData.wormState || 0,
          confidence: analysisData.confidence,
          amount: tradeAmount,
          entryTime: Date.now(),
          agreementCount: analysisData.agreementCount
        };
      }
    } catch (error) {
      addLog(`❌ Trade failed: ${error.message}`, 'error');
    }
  };

  const startTrading = () => {
    if (!isConnected) {
      addLog('Please connect first', 'error');
      return;
    }
    
    // Apply law agreement mode
    const mode = lawAgreementModes[settings.lawAgreementMode];
    setSettings(prev => ({
      ...prev,
      minAgreementLaws: mode.min
    }));
    
    setIsTrading(true);
    tradeCountRef.current = 0;
    activeContractsRef.current = [];
    setProfit(0);
    profitRef.current = 0;
    setTrades([]);
    setTicks([]);
    
    setMartingaleState({
      currentStep: 0,
      currentAmount: settings.tradeAmount,
      inMartingaleSequence: false
    });
    
    addLog('🚀 Complete Nikolas Algorithm Started', 'success');
    addLog(`📊 Law Agreement Mode: ${mode.label}`, 'info');
    if (settings.useMartingale) {
      const resetBehavior = settings.martingaleResetOnWin ? 'Reset on Win' : 'Continue on Win';
      addLog(`🎲 Martingale: ${settings.martingaleMultiplier}x multiplier, Max ${settings.maxMartingaleSteps} steps, ${resetBehavior}`, 'info');
    }
    
    // Start health monitoring
    startHealthMonitoring();
  };

  const stopTrading = () => {
    setIsTrading(false);
    stopHealthMonitoring();
    addLog('⏸️ Trading stopped', 'warning');
  };

  const activateCooldown = (durationSeconds, isAuto = false) => {
    // Remember if bot was trading before cooldown
    const wasTrading = isTradingRef.current;
    
    setCooldownSettings({
      isActive: true,
      durationSeconds: durationSeconds,
      selectedDuration: durationSeconds,
      wasTrading: wasTrading,
      autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
      autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
    });
    cooldownSettingsRef.current = {
      isActive: true,
      durationSeconds: durationSeconds,
      selectedDuration: durationSeconds,
      wasTrading: wasTrading,
      autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
      autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
    };
    setCooldownTimeLeft(durationSeconds);
    
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const triggerMsg = isAuto ? ' - Auto-triggered by take-profit' : '';
    addLog(`⏸️ Cooldown activated for ${timeStr}${triggerMsg} - Bot continues but NO trades during this period`, 'warning');
    
    // Clear any existing interval
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    
    // Start countdown
    let remaining = durationSeconds;
    cooldownIntervalRef.current = setInterval(() => {
      remaining--;
      setCooldownTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = null;
        setCooldownSettings({
          isActive: false,
          durationSeconds: 0,
          selectedDuration: 60,
          wasTrading: false,
          autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
          autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
        });
        cooldownSettingsRef.current = {
          isActive: false,
          durationSeconds: 0,
          selectedDuration: 60,
          wasTrading: false,
          autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
          autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
        };
        setCooldownTimeLeft(0);
        addLog('✅ Cooldown period ended - Bot can now place trades again', 'success');
        
        // Auto-resume trading if bot was trading before cooldown
        if (wasTrading && isTradingRef.current) {
          addLog('🚀 Auto-resuming trades after cooldown...', 'success');
        }
      }
    }, 1000);
  };

  const cancelCooldown = () => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    setCooldownSettings({
      isActive: false,
      durationSeconds: 0,
      selectedDuration: 60,
      wasTrading: false,
      autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
      autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
    });
    cooldownSettingsRef.current = {
      isActive: false,
      durationSeconds: 0,
      selectedDuration: 60,
      wasTrading: false,
      autoCooldownOnTakeProfit: cooldownSettingsRef.current?.autoCooldownOnTakeProfit || false,
      autoCooldownDuration: cooldownSettingsRef.current?.autoCooldownDuration || 60
    };
    setCooldownTimeLeft(0);
    addLog('🔄 Cooldown cancelled - Bot can place trades again', 'info');
  };

  // ===== BOT HEALTH MONITORING =====
  const startHealthMonitoring = () => {
    healthMonitoringEnabledRef.current = true;
    frozenRestartCountRef.current = 0;
    disconnectedRestartCountRef.current = 0;
    
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (!healthMonitoringEnabledRef.current) return;

      const now = Date.now();
      const lastTick = lastTickTimeRef.current;
      let timeSinceLastTick = lastTick ? (now - lastTick) / 1000 : 999;
      
      let status = 'disconnected';
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (timeSinceLastTick <= 5) {
          status = 'running';
        } else if (timeSinceLastTick <= 15) {
          status = 'slow';
        } else {
          status = 'frozen';
        }
      }

      const ticksPerSecond = tickCountRef.current / 5;
      tickCountRef.current = 0;
      
      // Format last tick time
      const lastTickTimeStr = lastTick ? new Date(lastTick).toLocaleTimeString() : '-';

      setBotHealth({
        status,
        ticksPerSecond: parseFloat(ticksPerSecond.toFixed(2)),
        lastTickTime: lastTickTimeStr,
        timeSinceLastTick: Math.floor(timeSinceLastTick),
        isMonitoring: true
      });

      // Auto-restart on frozen state
      if (status === 'frozen' && isTradingRef.current) {
        frozenRestartCountRef.current++;
        if (frozenRestartCountRef.current === 1) {
          addLog('🔴 BOT FROZEN - No ticks for 15+ seconds', 'error');
          addLog('🔄 Attempting auto-restart...', 'warning');
          
          // Stop and restart trading
          setIsTrading(false);
          setTimeout(() => {
            setIsTrading(true);
            addLog('🚀 Bot restarted after frozen state', 'success');
            frozenRestartCountRef.current = 0;
          }, 2000);
        }
      } else if (status !== 'frozen') {
        frozenRestartCountRef.current = 0;
      }

      // Auto-restart on disconnected state
      if (status === 'disconnected' && isTradingRef.current) {
        disconnectedRestartCountRef.current++;
        if (disconnectedRestartCountRef.current === 1) {
          addLog('❌ BOT DISCONNECTED - WebSocket lost', 'error');
          addLog('🔄 Attempting auto-reconnect & resume trading...', 'warning');
          
          // Stop trading temporarily
          setIsTrading(false);
          
          // Reconnect and resume
          setTimeout(() => {
            connectWebSocket();
            setTimeout(() => {
              setIsTrading(true);
              addLog('✅ Reconnected & resumed trading', 'success');
              disconnectedRestartCountRef.current = 0;
            }, 2000);
          }, 3000);
        }
      } else if (status !== 'disconnected') {
        disconnectedRestartCountRef.current = 0;
      }
    }, 5000);
  };

  const stopHealthMonitoring = () => {
    healthMonitoringEnabledRef.current = false;
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
    setBotHealth({
      status: 'disconnected',
      ticksPerSecond: 0,
      lastTickTime: null,
      timeSinceLastTick: 0,
      isMonitoring: false
    });
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHealthMonitoring();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsTrading(false);
    setTicks([]);
    reconnectAttemptsRef.current = 0;
    addLog('Disconnected successfully', 'info');
  };

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    isTradingRef.current = isTrading;
  }, [isTrading]);

  useEffect(() => {
    martingaleStateRef.current = martingaleState;
  }, [martingaleState]);

  useEffect(() => {
    analyticsRef.current = tradeAnalytics;
  }, [tradeAnalytics]);

  useEffect(() => {
    cooldownSettingsRef.current = cooldownSettings;
  }, [cooldownSettings]);

  useEffect(() => {
    lawWeightsRef.current = lawWeights;
  }, [lawWeights]);

  useEffect(() => {
    lawStatsRef.current = lawStats;
  }, [lawStats]);

  useEffect(() => {
    // Update current session display when session data changes
    setCurrentSession({
      sessionNumber: sessionCounterRef.current,
      startTime: sessionStartTimeRef.current,
      endReason: null,
      winTrades: sessionWinsRef.current,
      lossTrades: sessionLossesRef.current,
      totalProfit: profit,
      totalTrades: sessionTotalTradesRef.current,
      winRate: sessionTotalTradesRef.current > 0 
        ? (sessionWinsRef.current / sessionTotalTradesRef.current * 100).toFixed(2) 
        : 0
    });
  }, [profit, sessions]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="text-purple-400" />
                Nikolas Complete Algorithm Bot
              </h1>
              <p className="text-slate-400">
                7 Rules & Laws - Multi-Agreement System
                {accountInfo && (
                  <span className={`ml-3 px-2 py-1 rounded text-xs font-bold ${
                    accountInfo.loginid?.startsWith('VRT') 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {accountInfo.loginid?.startsWith('VRT') ? '🎮 DEMO MODE' : '💰 LIVE MODE'}
                  </span>
                )}
              </p>
            </div>
            <Target className="text-purple-400" size={48} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-lg p-6 text-white shadow-2xl hover:shadow-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-semibold">💰 Balance</p>
                <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
              </div>
              <TrendingUp size={40} className="opacity-60" />
            </div>
          </div>

          <div className={`bg-gradient-to-br ${profit >= 0 ? 'from-cyan-400 via-blue-500 to-indigo-600' : 'from-orange-400 via-red-500 to-pink-600'} rounded-lg p-6 text-white shadow-2xl hover:shadow-blue-500/50 transition-all`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/90 text-sm font-semibold">📊 Profit/Loss</p>
                <p className="text-3xl font-bold">${profit.toFixed(2)}</p>
              </div>
              <Activity size={40} className="opacity-60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 rounded-lg p-6 text-white shadow-2xl hover:shadow-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-semibold">📈 Total Trades</p>
                <p className="text-3xl font-bold">{trades.length}</p>
              </div>
              <Activity size={40} className="opacity-60" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 rounded-lg p-6 text-white shadow-2xl hover:shadow-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-semibold">⭐ Law Agreement</p>
                <p className="text-3xl font-bold">{analysis.agreementCount}/7</p>
              </div>
              <CheckCircle size={40} className="opacity-60" />
            </div>
          </div>

          <div className={`bg-gradient-to-br rounded-lg p-6 text-white shadow-2xl transition-all ${
            botHealth.status === 'running' ? 'from-green-400 via-emerald-500 to-teal-600 hover:shadow-green-500/50 animate-pulse' :
            botHealth.status === 'slow' ? 'from-yellow-400 via-amber-500 to-orange-600 hover:shadow-yellow-500/50' :
            'from-red-400 via-rose-500 to-pink-600 hover:shadow-red-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold opacity-90">🤖 Bot Health</p>
                <p className="text-2xl font-bold">
                  {botHealth.status === 'running' ? '🟢 RUNNING' :
                   botHealth.status === 'slow' ? '🟡 SLOW' :
                   botHealth.status === 'frozen' ? '🔴 FROZEN' :
                   '❌ DISCONNECTED'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">{botHealth.ticksPerSecond.toFixed(2)} ticks/s</p>
                <p className="text-sm font-semibold">{botHealth.timeSinceLastTick}s ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-cyan-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-4">🤖 Bot Health Monitor</h2>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border-2 ${
                  botHealth.status === 'running' ? 'bg-green-900/30 border-green-500 text-green-200' :
                  botHealth.status === 'slow' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200' :
                  botHealth.status === 'frozen' ? 'bg-red-900/30 border-red-500 text-red-200' :
                  'bg-gray-900/30 border-gray-500 text-gray-200'
                }`}>
                  <div className="font-semibold">Status</div>
                  <div className="text-lg">
                    {botHealth.status === 'running' ? '✅ BOT IS HEALTHY' :
                     botHealth.status === 'slow' ? '⚠️ NETWORK DELAY' :
                     botHealth.status === 'frozen' ? '❌ BOT IS FROZEN' :
                     '❌ DISCONNECTED'}
                  </div>
                </div>

                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <div className="text-xs text-slate-400 mb-1">📊 Ticks Per Second</div>
                  <div className="text-2xl font-bold text-cyan-300">{botHealth.ticksPerSecond.toFixed(2)}</div>
                </div>

                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <div className="text-xs text-slate-400 mb-1">⏱️ Last Tick Time</div>
                  <div className="text-sm text-slate-200 font-mono">{botHealth.lastTickTime || '-'}</div>
                </div>

                <div className={`p-3 rounded-lg border ${
                  botHealth.timeSinceLastTick <= 5 ? 'bg-green-900/20 border-green-500' :
                  botHealth.timeSinceLastTick <= 15 ? 'bg-yellow-900/20 border-yellow-500' :
                  'bg-red-900/20 border-red-500'
                }`}>
                  <div className="text-xs text-slate-400 mb-1">⏳ Time Since Last Tick</div>
                  <div className="text-2xl font-bold">
                    {botHealth.timeSinceLastTick <= 5 ? `✅ ${botHealth.timeSinceLastTick}s` :
                     botHealth.timeSinceLastTick <= 15 ? `⚠️ ${botHealth.timeSinceLastTick}s` :
                     `❌ ${botHealth.timeSinceLastTick}s`}
                  </div>
                </div>

                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 text-xs text-slate-300">
                  <p className="mb-2"><strong>Status Guide:</strong></p>
                  <p className="mb-1">🟢 Running: 0-5s since tick</p>
                  <p className="mb-1">🟡 Slow: 5-15s since tick</p>
                  <p>❌ Frozen: 15+ s since tick</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-green-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">📚 Law Weights (Self-Learning)</h2>
              
              <div className="space-y-2">
                {Object.entries(lawWeights).map(([lawName, weight]) => {
                  const stats = lawStats[lawName] || { wins: 0, losses: 0, calls: 0, puts: 0 };
                  const totalTrades = stats.wins + stats.losses;
                  const winRate = totalTrades > 0 ? ((stats.wins / totalTrades) * 100).toFixed(1) : '0.0';
                  const barWidth = Math.min(100, weight * 50);
                  
                  return (
                    <div key={lawName} className="bg-slate-700/50 p-2 rounded border border-slate-600">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-cyan-300">{lawName.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex gap-2 text-xs">
                          <span className="text-green-300">W:{stats.wins}</span>
                          <span className="text-red-300">L:{stats.losses}</span>
                          <span className="text-yellow-300">{winRate}%</span>
                          <span className="text-purple-300">{weight.toFixed(2)}x</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 rounded h-1.5">
                        <div 
                          className={`h-1.5 rounded transition-all ${
                            weight > 1.2 ? 'bg-green-500' :
                            weight > 0.8 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="text-xs text-slate-400 mt-3 p-2 bg-slate-900/50 rounded">
                  <p className="mb-1"><strong>🧠 How it learns:</strong></p>
                  <p>• Bot tracks which laws win/lose trades</p>
                  <p>• Weight = Win Rate × 2 (0.5x to 2.0x range)</p>
                  <p>• Laws with 60% wins = 1.2x weight</p>
                  <p>• Laws with 40% wins = 0.8x weight</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-blue-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">📊 Session Dashboard</h2>
              
              <div className="space-y-4">
                {/* Session Statistics Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg">
                    <div className="text-xs text-blue-300 mb-1">📈 Total Sessions</div>
                    <div className="text-2xl font-bold text-blue-200">{sessions.length}</div>
                  </div>
                  
                  <div className={`border p-3 rounded-lg ${
                    sessions.reduce((sum, s) => sum + s.totalProfit, 0) >= 0 
                      ? 'bg-green-900/30 border-green-600' 
                      : 'bg-red-900/30 border-red-600'
                  }`}>
                    <div className={`text-xs mb-1 ${
                      sessions.reduce((sum, s) => sum + s.totalProfit, 0) >= 0 
                        ? 'text-green-300' 
                        : 'text-red-300'
                    }`}>💰 Total Profit</div>
                    <div className={`text-2xl font-bold ${
                      sessions.reduce((sum, s) => sum + s.totalProfit, 0) >= 0 
                        ? 'text-green-200' 
                        : 'text-red-200'
                    }`}>${sessions.reduce((sum, s) => sum + s.totalProfit, 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Current Session Stats */}
                <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg">
                  <div className="text-sm font-semibold text-purple-300 mb-2">🟢 CURRENT SESSION #{sessionCounterRef.current}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Wins</div>
                      <div className="text-green-300 font-bold">{sessionWinsRef.current}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Losses</div>
                      <div className="text-red-300 font-bold">{sessionLossesRef.current}</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                      <div className="text-slate-400">Total</div>
                      <div className="text-cyan-300 font-bold">{sessionTotalTradesRef.current}</div>
                    </div>
                  </div>
                </div>

                {/* Session History */}
                {sessions.length > 0 ? (
                  <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <div className="text-sm font-semibold text-slate-300 mb-2">📋 Session History</div>
                    <div className="space-y-2">
                      {[...sessions].reverse().map((session, idx) => (
                        <div key={idx} className="bg-slate-800/50 p-2 rounded text-xs border border-slate-600">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-cyan-300">Session #{session.sessionNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-white font-bold ${
                              session.endReason === 'take-profit' ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {session.endReason === 'take-profit' ? '🎯 TP' : '🛑 SL'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs text-slate-300">
                            <div>Profit: <span className={session.totalProfit >= 0 ? 'text-green-300 font-bold' : 'text-red-300 font-bold'}>
                              ${session.totalProfit.toFixed(2)}
                            </span></div>
                            <div>W/L: <span className="text-cyan-300 font-bold">{session.winTrades}/{session.lossTrades}</span></div>
                            <div>W%: <span className="text-yellow-300 font-bold">{session.winRate}%</span></div>
                            <div className="text-slate-400">Trades: {session.totalTrades}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-700/50 border border-slate-600 p-3 rounded text-center text-slate-400 text-sm">
                    No sessions completed yet. Sessions end when TP or SL is hit.
                  </div>
                )}

                {/* Session Info */}
                <div className="bg-slate-900/50 border border-slate-600 p-2 rounded text-xs text-slate-400">
                  <p className="mb-1"><strong>📊 Session Info:</strong></p>
                  <p>• Each session starts when you begin trading</p>
                  <p>• Session ends when Take-Profit or Stop-Loss is triggered</p>
                  <p>• Win Rate = Wins ÷ Total Trades × 100%</p>
                  <p>• Track performance per session to optimize strategy</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <Settings className="text-purple-400" />
                Configuration
              </h2>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-4 rounded-lg border border-purple-500">
                  <label className="block text-white font-semibold mb-3">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAccountType('demo')}
                      disabled={isConnected}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        accountType === 'demo'
                          ? 'bg-green-600 text-white shadow-lg scale-105'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      🎮 DEMO
                    </button>
                    <button
                      onClick={() => setAccountType('real')}
                      disabled={isConnected}
                      className={`px-4 py-3 rounded-lg font-bold transition-all ${
                        accountType === 'real'
                          ? 'bg-red-600 text-white shadow-lg scale-105'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      💰 REAL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">
                    API Token {accountType === 'demo' ? '(Demo)' : '(Real)'}
                  </label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder={`Enter your ${accountType.toUpperCase()} API token`}
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                    disabled={isConnected}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Symbol</label>
                  <select
                    value={settings.symbol}
                    onChange={(e) => setSettings({...settings, symbol: e.target.value})}
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                    disabled={isTrading}
                  >
                    <option value="R_100">Volatility 100 Index</option>
                    <option value="R_75">Volatility 75 Index</option>
                    <option value="R_50">Volatility 50 Index</option>
                    <option value="R_25">Volatility 25 Index</option>
                    <option value="R_10">Volatility 10 Index</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Trade Amount ($)</label>
                    <input
                      type="number"
                      value={settings.tradeAmount}
                      onChange={(e) => setSettings({...settings, tradeAmount: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                      disabled={isTrading}
                      min="0.35"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Trade Duration</label>
                    <select
                      value={settings.tradeDuration}
                      onChange={(e) => setSettings({...settings, tradeDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                      disabled={isTrading}
                    >
                      <option value="5">5 Ticks (Fast)</option>
                      <option value="7">7 Ticks (Recommended)</option>
                      <option value="10">10 Ticks (Safe)</option>
                      <option value="12">12 Ticks (Very Safe)</option>
                      <option value="15">15 Ticks (Ultra Safe)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                  <label className="block text-white font-semibold mb-3">Law Agreement Mode</label>
                  <div className="space-y-2">
                    {Object.entries(lawAgreementModes).map(([key, mode]) => (
                      <button
                        key={key}
                        onClick={() => setSettings({...settings, lawAgreementMode: key})}
                        disabled={isTrading}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          settings.lawAgreementMode === key
                            ? 'border-blue-400 bg-blue-900/50 text-white'
                            : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                        } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="font-semibold">{mode.label}</div>
                        <div className="text-xs mt-1 opacity-75">{mode.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-white font-semibold">🎲 Martingale System</label>
                    <button
                      onClick={() => setSettings({...settings, useMartingale: !settings.useMartingale})}
                      disabled={isTrading}
                      className={`px-4 py-2 rounded font-semibold transition-all ${
                        settings.useMartingale 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {settings.useMartingale ? '✓ ACTIVE' : 'OFF'}
                    </button>
                  </div>
                  
                  {settings.useMartingale && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 text-xs mb-1">Multiplier (on loss)</label>
                          <select
                            value={settings.martingaleMultiplier}
                            onChange={(e) => setSettings({...settings, martingaleMultiplier: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 text-sm"
                            disabled={isTrading}
                          >
                            <option value="1.5">1.5x (Low Risk)</option>
                            <option value="2">2x (Standard)</option>
                            <option value="2.5">2.5x (Moderate)</option>
                            <option value="3">3x (Aggressive)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-xs mb-1">Max Steps</label>
                          <select
                            value={settings.maxMartingaleSteps}
                            onChange={(e) => setSettings({...settings, maxMartingaleSteps: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 text-sm"
                            disabled={isTrading}
                          >
                            <option value="2">2 Steps</option>
                            <option value="3">3 Steps (Safe)</option>
                            <option value="4">4 Steps</option>
                            <option value="5">5 Steps (Risky)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 text-xs mb-1">Start From</label>
                          <select
                            value={settings.martingaleStartFrom}
                            onChange={(e) => setSettings({...settings, martingaleStartFrom: e.target.value})}
                            className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 text-sm"
                            disabled={isTrading}
                          >
                            <option value="loss">1st Loss</option>
                            <option value="first">1st Trade</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-xs mb-1">Reset</label>
                          <button
                            onClick={() => setSettings({...settings, martingaleResetOnWin: !settings.martingaleResetOnWin})}
                            className={`w-full px-2 py-2 rounded text-xs font-semibold transition-all ${
                              settings.martingaleResetOnWin
                                ? 'bg-green-700 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                            disabled={isTrading}
                          >
                            {settings.martingaleResetOnWin ? '✓ Reset on Win' : 'Continue'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded p-2 text-xs text-yellow-200">
                        <p className="font-semibold mb-2">⚠️ Current State:</p>
                        <p className="mb-2">Step: {martingaleState.currentStep} | Amount: ${martingaleState.currentAmount.toFixed(2)}</p>
                        
                        <div className="mt-2 pt-2 border-t border-yellow-600/30">
                          <p className="font-semibold mb-1 text-xs">Progression:</p>
                          <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: settings.maxMartingaleSteps + 1 }).map((_, step) => {
                              const stepAmount = settings.tradeAmount * Math.pow(settings.martingaleMultiplier, step);
                              const isActive = step === martingaleState.currentStep;
                              return (
                                <div
                                  key={step}
                                  className={`px-2 py-1 rounded text-xs font-mono ${
                                    isActive 
                                      ? 'bg-yellow-500 text-black font-bold' 
                                      : 'bg-slate-700/50 text-yellow-200'
                                  }`}
                                >
                                  S{step}:${stepAmount.toFixed(0)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!settings.useMartingale && (
                    <div className="text-slate-400 text-xs italic">
                      Enable Martingale to increase stakes after losses and recover with single win
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Max Trades</label>
                    <input
                      type="number"
                      value={settings.maxTrades}
                      onChange={(e) => setSettings({...settings, maxTrades: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                      disabled={isTrading}
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Target ($)</label>
                    <input
                      type="number"
                      value={settings.targetProfit}
                      onChange={(e) => setSettings({...settings, targetProfit: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                      disabled={isTrading}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">Stop Loss ($)</label>
                  <input
                    type="number"
                    value={settings.stopLoss}
                    onChange={(e) => setSettings({...settings, stopLoss: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-purple-500 focus:outline-none"
                    disabled={isTrading}
                    min="1"
                  />
                </div>

                <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-semibold">🎯 Auto-Cooldown on Take-Profit</label>
                    <button
                      onClick={() => setCooldownSettings({...cooldownSettings, autoCooldownOnTakeProfit: !cooldownSettings.autoCooldownOnTakeProfit})}
                      disabled={isTrading}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        cooldownSettings.autoCooldownOnTakeProfit
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {cooldownSettings.autoCooldownOnTakeProfit ? '✓ ACTIVE' : 'OFF'}
                    </button>
                  </div>

                  {cooldownSettings.isActive && (
                    <div className="bg-red-900/40 border border-red-500 rounded-lg p-3 mb-3 text-center">
                      <p className="text-red-200 font-semibold mb-2 text-sm">🔴 COOLDOWN ACTIVE</p>
                      <p className="text-2xl font-bold text-red-300 font-mono">
                        {Math.floor(cooldownTimeLeft / 60)}:{String(cooldownTimeLeft % 60).padStart(2, '0')}
                      </p>
                    </div>
                  )}
                  
                  {cooldownSettings.autoCooldownOnTakeProfit && (
                    <div>
                      <label className="text-slate-300 text-xs mb-2 block">Duration after take-profit hit:</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setCooldownSettings({...cooldownSettings, autoCooldownDuration: 60})}
                          disabled={isTrading}
                          className={`px-2 py-2 rounded text-xs font-semibold transition-all ${
                            cooldownSettings.autoCooldownDuration === 60
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          1 Min
                        </button>
                        <button
                          onClick={() => setCooldownSettings({...cooldownSettings, autoCooldownDuration: 1800})}
                          disabled={isTrading}
                          className={`px-2 py-2 rounded text-xs font-semibold transition-all ${
                            cooldownSettings.autoCooldownDuration === 1800
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          30 Min
                        </button>
                        <button
                          onClick={() => setCooldownSettings({...cooldownSettings, autoCooldownDuration: 3600})}
                          disabled={isTrading}
                          className={`px-2 py-2 rounded text-xs font-semibold transition-all ${
                            cooldownSettings.autoCooldownDuration === 3600
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } ${isTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          60 Min
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs mt-2">When take-profit is hit, bot will cooldown, reset, and start trading again</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isConnected ? (
                    <>
                      <button
                        onClick={connectWebSocket}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!apiToken}
                      >
                        {!apiToken ? 'Enter API Token First' : 'Connect'}
                      </button>
                      <button
                        onClick={testConnection}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                      >
                        🧪 Test
                      </button>
                    </>
                  ) : (
                    <>
                      {!isTrading ? (
                        <button
                          onClick={startTrading}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Play size={20} />
                          Start Algorithm
                        </button>
                      ) : (
                        <button
                          onClick={stopTrading}
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Pause size={20} />
                          Stop Algorithm
                        </button>
                      )}
                      <button
                        onClick={disconnect}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-cyan-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">📊 Last Digits</h2>
              <div className="flex gap-2 flex-wrap">
                {ticks.map((tick, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-3 rounded-lg font-bold text-lg shadow-lg transition-all hover:scale-110 ${
                      tick.color === 'blue' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/50' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/50'
                    } text-white relative`}
                  >
                    {tick.digit}
                    <span className="absolute -top-1 -right-1 text-xs bg-slate-900 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {isOdd(tick.digit) ? 'O' : 'E'}
                    </span>
                  </div>
                ))}
              </div>
              {ticks.length === 0 && (
                <p className="text-slate-400 text-center py-8">⏳ Waiting for tick data...</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-pink-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-4">✨ 7 Laws Analysis</h2>
              
              {analysis.signal && (
                <div className={`p-4 rounded-lg mb-4 border-2 ${
                  analysis.signal === 'CALL' ? 'bg-gradient-to-br from-emerald-900/40 to-green-900/40 border-emerald-500/60 shadow-emerald-500/20' :
                  analysis.signal === 'PUT' ? 'bg-gradient-to-br from-rose-900/40 to-red-900/40 border-rose-500/60 shadow-rose-500/20' :
                  'bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-yellow-500/60 shadow-yellow-500/20'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-white font-bold text-2xl ${
                      analysis.signal === 'CALL' ? 'text-emerald-300' : 'text-rose-300'
                    }`}>📍 Signal: {analysis.signal}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${
                        analysis.confidence === 'high' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                        analysis.confidence === 'medium' ? 'bg-gradient-to-r from-amber-500 to-yellow-600' :
                        'bg-gradient-to-r from-slate-600 to-slate-700'
                      }`}>
                        {analysis.confidence.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-600">
                        {analysis.agreementCount}/7 Laws
                      </span>
                    </div>
                  </div>

                  {analysis.laws && Object.keys(analysis.laws).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(analysis.laws).map(([law, signal]) => (
                        <div key={law} className={`p-2 rounded text-xs border ${
                          signal === 'CALL' ? 'bg-emerald-800/40 border-emerald-500/60 text-emerald-200' :
                          signal === 'PUT' ? 'bg-rose-800/40 border-rose-500/60 text-rose-200' :
                          'bg-slate-700/50 border-slate-600/60 text-slate-300'
                        }`}>
                          <span className="font-semibold">{law.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="float-right font-bold">{signal}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-slate-300 space-y-1 max-h-64 overflow-y-auto">
                    {analysis.reasoning.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">→</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-cyan-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">🔗 Hybrid System Status</h2>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-800/30 border border-purple-500/50">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200 font-semibold">7 Laws Algorithm</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${analysis.signal !== 'WAIT' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                      {analysis.signal !== 'WAIT' ? `✅ ${analysis.signal}` : '⏳ WAIT'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 mt-1">{analysis.agreementCount}/7 laws agree</p>
                </div>

                <div className="p-3 rounded-lg bg-blue-800/30 border border-blue-500/50">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 font-semibold">Market Position Rules</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${analysis.hybridConfirmed ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                      {analysis.hybridConfirmed ? '✅ MATCH' : '⏳ WAITING'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">Worm + Market Detection</p>
                </div>

                <div className={`p-3 rounded-lg border-2 ${analysis.hybridConfirmed ? 'bg-gradient-to-r from-green-800/40 to-emerald-800/40 border-green-500/70' : 'bg-gradient-to-r from-amber-800/40 to-yellow-800/40 border-amber-500/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Both Systems Agreement</span>
                    <span className={`px-3 py-1 rounded text-sm font-bold ${analysis.hybridConfirmed ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-amber-600 text-white'}`}>
                      {analysis.hybridConfirmed ? '🟢 CONFIRMED - TRADE!' : '🟡 PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {analysis.hybridConfirmed ? '✅ 7 Laws AND Market Rules agree - Execute trade' : '⏳ Waiting for both systems to align'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-green-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">📈 Recent Trades</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trades.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">⏳ No trades yet</p>
                ) : (
                  trades.slice(-10).reverse().map((trade, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">
                          {trade.type} • ${trade.amount.toFixed(2)}
                        </p>
                        <p className="text-slate-400 text-sm">{trade.time}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          trade.status === 'win' ? 'text-green-400' : 
                          trade.status === 'loss' ? 'text-red-400' : 
                          'text-yellow-400'
                        }`}>
                          {trade.status === 'pending' ? 'PENDING' : 
                           trade.status === 'win' ? 'WIN ✓' : 'LOSS ✗'}
                        </p>
                        {trade.profit !== undefined && (
                          <p className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            ${trade.profit.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-xl p-6 border border-green-500/20">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">📊 Trade Analytics & Patterns</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-500/50">
                  <p className="text-blue-300 text-sm">Total Trades</p>
                  <p className="text-2xl font-bold text-blue-200">{tradeAnalytics.totalTrades}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-green-900/30 border border-green-500/50">
                  <p className="text-green-300 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-green-200">
                    {tradeAnalytics.totalTrades > 0 
                      ? ((tradeAnalytics.winTrades.length / tradeAnalytics.totalTrades) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50">
                  <p className="text-emerald-300 text-sm">Consecutive Wins</p>
                  <p className="text-2xl font-bold text-emerald-200">{tradeAnalytics.consecutiveWins} (Max: {tradeAnalytics.maxConsecutiveWins})</p>
                </div>
                
                <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-500/50">
                  <p className="text-purple-300 text-sm">Wins / Losses</p>
                  <p className="text-2xl font-bold text-purple-200">{tradeAnalytics.winTrades.length} / {tradeAnalytics.lossTrades.length}</p>
                </div>
              </div>

              {tradeAnalytics.totalTrades >= 5 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-900/30 border border-amber-500/50">
                    <p className="text-amber-300 text-sm font-semibold mb-2">✅ Best Performing Law Combinations:</p>
                    <div className="space-y-1 text-xs">
                      {Object.entries(tradeAnalytics.lawPatterns)
                        .filter(([, data]) => data.trades >= 2)
                        .sort(([, a], [, b]) => (b.wins / b.trades) - (a.wins / a.trades))
                        .slice(0, 3)
                        .map(([laws, data]) => (
                          <p key={laws} className="text-amber-200">
                            Laws {laws}: {data.wins}/{data.trades} wins ({((data.wins/data.trades)*100).toFixed(0)}%)
                          </p>
                        ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-900/30 border border-cyan-500/50">
                    <p className="text-cyan-300 text-sm font-semibold mb-2">🎯 Best Market Conditions:</p>
                    <div className="space-y-1 text-xs">
                      {Object.entries(tradeAnalytics.marketConditionPatterns)
                        .filter(([, data]) => data.trades >= 2)
                        .sort(([, a], [, b]) => (b.wins / b.trades) - (a.wins / a.trades))
                        .slice(0, 3)
                        .map(([condition, data]) => (
                          <p key={condition} className="text-cyan-200">
                            {condition}: {data.wins}/{data.trades} wins ({((data.wins/data.trades)*100).toFixed(0)}%)
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {tradeAnalytics.totalTrades < 5 && (
                <p className="text-slate-400 text-sm italic text-center py-4">
                  📈 Collect 5+ trades to unlock pattern analysis and optimization
                </p>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Activity Log</h2>
              <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No activity yet</p>
                ) : (
                  logs.slice(-20).reverse().map((log, idx) => (
                    <div key={idx} className={`p-2 rounded ${
                      log.type === 'error' ? 'bg-red-900/30 text-red-300' :
                      log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                      log.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-6 mt-6">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={24} />
            <div className="text-yellow-200">
              <p className="font-bold mb-2">⚠️ Important Information</p>
              <ul className="space-y-1 text-sm">
                <li>• Complete implementation of Mr. Nikolas's 7 Rules & Laws system</li>
                <li>• Bot requires multiple laws to agree before trading</li>
                <li>• <strong>ALWAYS test on DEMO account first!</strong></li>
                <li>• Never invest more than you can afford to lose</li>
                <li>• Past performance does not guarantee future results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
