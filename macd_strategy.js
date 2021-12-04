//@version=5
var initialCapital = strategy.equity
strategy(title="MACD with INPUTS and outer period and lowest", initial_capital=10000, default_qty_type=strategy.cash, default_qty_value=10000, overlay=true)

// MACD params
var macdLbl = "MACD"
fastLength = input(12, group=macdLbl)
slowlength = input(26, group=macdLbl)
MACDLength = input(9, group=macdLbl)

var tradingParams = "Trading Configuration"
marginMulti = input.float(1.0, "Margin", minval = 1.0, step = 0.1, group=tradingParams)
closeEod = input.bool(false, "Close end of day?", group=tradingParams)
// LONG PARAMS

var longLabal = "LONG"
long = input.bool(true, "Go Long?", group=longLabal)
goLongOnCrossUp = input.bool(true, "Go Long on MACD Cross ups?", group=longLabal)
goLongOnHistUp = input.bool(true, "Go Long when hist goes up?", group=longLabal)
goLongOnHistUpPeriods = input(4, "number of periods for hist to go up", group=longLabal)

entryMacdLow = input.float(-4, "Long Entry MACD", minval = -20, step = 0.1, group=longLabal)
entryMacdHigh = input.float(4, "Long Entry MACD", minval = -20, step = 0.1, group=longLabal)
profitMacd = input.float(1.0, "Long Profit MACD", minval = 0.001, step = 0.1, group=longLabal)
stopMacd = input.float(0.01, "Long STOP MACD", minval = 0, step = 0.1, group=longLabal)
limit = input.float(1.1, "Take Profits", minval = 1, step = 0.005, group=longLabal)
stopLoss = input.float(0.99, "Stop Loss", maxval = 1.0, step = 0.005, group=longLabal)
useOuterPeriod = input.bool(false, "Use outer period?", group=longLabal)
outPeriodLessThan = input.bool(true, "Outer period less than", group=longLabal)
outerPeriodLenth = input("60", "Outer period length", group=longLabal)
outerPeriodDelta = input.float(0.0, "Outer period delta", step = 0.1, group=longLabal)

// short params
var shortLabel = "SHORT"

short = input.bool(false, "Go Short?", group=shortLabel)
goShortOnCrossDown = input.bool(true, "Go short on MACD Cross down?", group=shortLabel)
goShortOnHistDown = input.bool(true, "Go short when hist goes down?", group=shortLabel)
goShortOnHistDownPeriods = input(4, "number of periods for hist to go down", group=shortLabel)
shortEntryMacdLow = input.float(-4, "Entry MACD", minval = -20, step = 0.1, group=shortLabel)
shortProfitMacd = input.float(1.0, "Profit MACD", minval = 0.001, step = 0.1, group=shortLabel)
shortEntryMacdHigh = input.float(4, "Entry MACD", minval = -20, step = 0.1, group=shortLabel)
shortStopMacd = input.float(0.05, "STOP MACD", minval = 0, step = 0.1, group=shortLabel)
shortLimit = input.float(0.9, "Take Profits", maxval = 1.0, step = 0.005, group=shortLabel)
shortStopLoss = input.float(1.1, "Stop Loss", minval = 1.0, step = 0.005, group=shortLabel)
shortUseOuterPeriod = input.bool(true, "Use outer short period?", group=shortLabel)
shortOutPeriodLessThan = input.bool(true, "Short Outer period less than", group=shortLabel)
shortOuterPeriodDelta = input.float(0.0, "Short Outer period delta", step = 0.1, group=shortLabel)
shortStopPeriods = input(2, "Short Stop Periods")

// MACDS
fastMA = ta.ema(close, fastLength)
slowMA = ta.ema(close, slowlength)
macdLine = fastMA - slowMA
signalLine = ta.ema(macdLine, 9)
histLine = macdLine - signalLine
shortOuterPeriodLenth = input("1D", "Outer period length")
[smacdLineD, ssignalLineD, shistLineD] = request.security(syminfo.tickerid, shortOuterPeriodLenth, [macdLine, signalLine, histLine])
[macdLineD, signalLineD, histLineD] = request.security(syminfo.tickerid, outerPeriodLenth, [macdLine, signalLine, histLine])
MACD = ta.ema(close, fastLength) - ta.ema(close, slowlength)
aMACD = ta.ema(MACD, MACDLength)
delta = MACD - aMACD
signal = ta.ema(MACD, 9)
deltas = 0.0
deltas := delta

//OUTER PERIOD CONFIGURATION
canGoLong = false
canGoShort = false
if(not(useOuterPeriod))
    canGoLong := true

if(not(shortUseOuterPeriod))
    canGoShort := true

if(outPeriodLessThan)
    if (histLineD < outerPeriodDelta )
        canGoLong := true
else 
    if (histLineD > shortOuterPeriodDelta )
        canGoLong := true
        
if(shortOutPeriodLessThan)
    if (shistLineD < shortOuterPeriodDelta )
        canGoShort := true
else 
    if (shistLineD > shortOuterPeriodDelta )
        canGoShort := true
//OUTER PERIOD CONFIGURATION


//BALANCES
currentBalance = strategy.initial_capital + strategy.netprofit
balanceInContracts = (currentBalance/close) * marginMulti
isShort = (strategy.position_size < 0)
isLong = (strategy.position_size > 0)
//BALANCES

//STOP LOSSES ND TARGETS
highest = ta.highest(shortStopPeriods) * shortStopLoss
lowest = ta.lowest(shortStopPeriods) * stopLoss

// close EOD params
openEod = true 
if(hour(time) >= 14 and closeEod)
    openEod := false
    
//LONG MACD PROFITS AND STOPS
longMacdEntry = (signal > entryMacdLow and signal < entryMacdHigh)

longExitSignal = 0.00 

longMacdProfit = signal > longExitSignal[1] + profitMacd
longMacdStop = (signal < ( longExitSignal[1] - stopMacd ))
//LONG MACD PROFITS AND STOPS


//LONG ENTRY LOGIC
entryEvent = false 
if(goLongOnCrossUp and ta.crossover(delta, 0))
    longExitSignal := signal
    entryEvent := true
else if(goLongOnHistUp and delta < 0 and deltas[goLongOnHistUpPeriods] < delta)
    longExitSignal := signal
    entryEvent := true
else 
    longExitSignal := longExitSignal[1]
    
longEntry = long and entryEvent[1] and longMacdEntry and not(isLong) and(canGoLong[1]) and(openEod[1])
endOfDayClose = closeEod and hour(time) == 15

if (longEntry)
	strategy.entry("LONG", strategy.long, comment="entry LONG", qty=balanceInContracts)
	strategy.exit("LONG", comment="STOP or LIMIT", limit=high*limit, stop=lowest)
	//strategy.close("short")
else if (longMacdProfit)
    comment = "profit "
	strategy.close("LONG", comment=comment )
else if (longMacdStop)
    strategy.close("LONG", comment="stop " )
if(endOfDayClose)
    strategy.close("LONG", comment="EOD")
//LONG ENTRY LOGIC


// SHORT 
shortMacdEntry = signal > shortEntryMacdLow and signal < shortEntryMacdHigh
shortExitSignal = 0.00 
shortEntryEvent = false 
if(goShortOnCrossDown and ta.crossunder(delta, 0))
    shortExitSignal := signal
    shortEntryEvent := true
else if(goShortOnHistDown and delta > 0 and deltas[goShortOnHistDownPeriods] > delta)
    shortExitSignal := signal
    shortEntryEvent := true
else 
    shortExitSignal := shortExitSignal[1]

shortProfit = signal < shortExitSignal[1] - shortProfitMacd
shortStop = (signal > ( shortExitSignal[1] + shortStopMacd ))

    
shortEntry = (short and shortEntryEvent and shortMacdEntry and not(isShort)  and(canGoShort[1]) and openEod[1])

//SHORT ENTRY LOGIC
if (shortEntry)
    strategy.entry("SHORT", strategy.short, comment="short", qty=balanceInContracts)
    strategy.exit("SHORT", stop=highest,  limit=low*shortLimit, comment="stop or limit")
else if (shortProfit)
    comment = "short macd profit "
	strategy.close("SHORT", comment=comment )
else if (shortStop)
    strategy.close("SHORT", comment="macd stop " )
if(endOfDayClose)
    strategy.close("SHORT", comment="EOD")
  
