import { useState } from "react";
import { useData } from "../hooks/useFetch";
import { api } from "../lib/api";
import ErrorBoundary from "../components/ErrorBoundary";
import { AreaChart } from "../components/Charts";
import { Activity } from "lucide-react";

const SIGNALS = ["equities", "fixed_income", "commodities"];

function IndicatorRow({ label, value, unit, color }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[10px] text-txt-3">{label}</span>
      <span className="text-[11px] mono font-medium" style={{ color: color || "#e8e8f0" }}>
        {value != null ? `${typeof value === "number" ? value.toFixed(2) : value}${unit || ""}` : "—"}
      </span>
    </div>
  );
}

function RsiGauge({ value }) {
  if (value == null) return null;
  const color = value > 70 ? "#ef4444" : value > 30 ? "#eab308" : "#10b981";
  const label = value > 70 ? "Overbought" : value < 30 ? "Oversold" : "Neutral";
  return (
    <div className="text-center p-2 bg-bg-3 rounded-md">
      <p className="text-[18px] mono font-bold" style={{ color }}>{value.toFixed(1)}</p>
      <p className="text-[9px] text-txt-3">RSI 14 — {label}</p>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="text-center p-2 bg-bg-3 rounded-md">
      <p className="text-[14px] mono font-semibold" style={{ color: color || "#e8e8f0" }}>{value}</p>
      <p className="text-[9px] text-txt-3">{label}</p>
    </div>
  );
}

export default function Indicators() {
  const [manager, setManager] = useState("");
  const [signal, setSignal] = useState("equities");

  const { d: managers } = useData(() => api.managers(), []);
  const managerList = managers?.managers ?? [];

  const shouldFetch = manager !== "";
  const { d: data, loading } = useData(
    () => api.indicators(manager, signal, 90),
    [manager, signal],
    { enabled: shouldFetch }
  );
  const { d: regime } = useData(
    () => api.correlationRegime(signal, 90),
    [signal]
  );

  const latest = data?.length > 0 ? data[data.length - 1] : null;

  return (
    <ErrorBoundary>
      <div className="p-3 md:p-4 space-y-3">
        <div>
          <h1 className="text-base font-semibold text-txt-1">Technical Indicators</h1>
          <p className="text-[11px] text-txt-3">SMA, EMA, Bollinger, RSI, MACD, Stochastic, ADX, Ichimoku, Williams %R, CCI, ROC, Keltner, Sharpe, Sortino, VaR</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={manager} onChange={(e) => setManager(e.target.value)}
            className="bg-bg-3 border border-border rounded-md px-2.5 py-1.5 text-[11px] text-txt-1 focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="">Select Manager</option>
            {managerList.map(m => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
          </select>
          <div className="flex items-center gap-1">
            {SIGNALS.map(s => (
              <button key={s} onClick={() => setSignal(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors
                  ${signal === s ? "bg-accent text-white" : "text-txt-3 hover:text-txt-2 bg-bg-3"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {!shouldFetch && (
          <div className="text-center py-12">
            <Activity size={32} className="text-txt-3 mx-auto mb-3 opacity-50" />
            <p className="text-[12px] text-txt-3">Select a manager to view technical indicators</p>
          </div>
        )}

        {shouldFetch && loading && (
          <div className="flex items-center justify-center h-40 text-txt-3 text-[12px]">
            <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
            Computing indicators...
          </div>
        )}

        {shouldFetch && !loading && data && data.length === 0 && (
          <p className="text-[11px] text-txt-3 text-center py-8">No data available for this manager/signal</p>
        )}

        {shouldFetch && !loading && latest && (
          <div className="space-y-3">
            {/* RSI + MACD + Stochastic Gauges */}
            <div className="grid grid-cols-3 gap-3">
              <RsiGauge value={latest.rsi_14} />
              <div className="text-center p-2 bg-bg-3 rounded-md">
                <p className="text-[14px] mono font-bold" style={{ color: latest.macd_histogram > 0 ? "#10b981" : "#ef4444" }}>
                  {latest.macd_histogram?.toFixed(2) ?? "—"}
                </p>
                <p className="text-[9px] text-txt-3">MACD Hist</p>
              </div>
              <div className="text-center p-2 bg-bg-3 rounded-md">
                <p className="text-[14px] mono font-bold" style={{ color: latest.stoch_k > 80 ? "#ef4444" : latest.stoch_k < 20 ? "#10b981" : "#eab308" }}>
                  {latest.stoch_k?.toFixed(1) ?? "—"}
                </p>
                <p className="text-[9px] text-txt-3">Stoch %K</p>
              </div>
            </div>

            {/* Price + Moving Averages */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Price & Moving Averages</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["value", "sma_5", "sma_10", "sma_20", "ema_12", "ema_26"]}
                  colors={["#e8e8f0", "#0ea5a5", "#06b6d4", "#8b5cf6", "#d946ef", "#f59e0b"]}
                  height={200}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#e8e8f0" }} /> Price</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#0ea5a5" }} /> SMA 5</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} /> SMA 10</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} /> SMA 20</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#d946ef" }} /> EMA 12</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} /> EMA 26</span>
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Bollinger Bands (20, 2σ)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["value", "bb_upper", "bb_mid", "bb_lower"]}
                  colors={["#e8e8f0", "#ef4444", "#eab308", "#10b981"]}
                  height={180}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#e8e8f0" }} /> Price</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /> Upper</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#eab308" }} /> Mid</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} /> Lower</span>
              </div>
            </div>

            {/* MACD */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">MACD (12, 26, 9)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["macd_line", "macd_signal", "macd_histogram"]}
                  colors={["#0ea5a5", "#ef4444", "#8b5cf6"]}
                  height={150}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#0ea5a5" }} /> MACD</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /> Signal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} /> Histogram</span>
              </div>
            </div>

            {/* RSI */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">RSI (14)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["rsi_14"]}
                  colors={["#8b5cf6"]}
                  height={120}
                />
              </div>
              <div className="flex justify-between text-[9px] text-txt-3">
                <span>Oversold (&lt;30)</span>
                <span>Overbought (&gt;70)</span>
              </div>
            </div>

            {/* Stochastic */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Stochastic Oscillator (14, 3)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["stoch_k", "stoch_d"]}
                  colors={["#06b6d4", "#d946ef"]}
                  height={120}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} /> %K</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#d946ef" }} /> %D</span>
              </div>
            </div>

            {/* ADX */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">ADX — Trend Strength (14)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["adx"]}
                  colors={["#f59e0b"]}
                  height={120}
                />
              </div>
              <div className="flex justify-between text-[9px] text-txt-3">
                <span>Weak trend (&lt;20)</span>
                <span>Strong trend (&gt;40)</span>
              </div>
            </div>

            {/* Ichimoku Cloud */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Ichimoku Cloud (9, 26, 52)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["value", "tenkan_sen", "kijun_sen", "senkou_a", "senkou_b"]}
                  colors={["#e8e8f0", "#0ea5a5", "#ef4444", "#10b981", "#6b7280"]}
                  height={180}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#e8e8f0" }} /> Price</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#0ea5a5" }} /> Tenkan</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} /> Kijun</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} /> Senkou A</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#6b7280" }} /> Senkou B</span>
              </div>
            </div>

            {/* Williams %R + CCI + ROC */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Williams %R (14)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["williams_r"]} colors={["#d946ef"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">CCI (20)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["cci"]} colors={["#06b6d4"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">ROC (12)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["roc"]} colors={["#8b5cf6"]} height={100} />
                </div>
              </div>
            </div>

            {/* Keltner Channels */}
            <div className="card p-3 space-y-2">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Keltner Channels (20, 10, 2x)</p>
              <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                <AreaChart
                  data={data}
                  yKeys={["value", "keltner_upper", "keltner_mid", "keltner_lower"]}
                  colors={["#e8e8f0", "#f59e0b", "#0ea5a5", "#f59e0b"]}
                  height={150}
                />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#e8e8f0" }} /> Price</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} /> Upper/Lower</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#0ea5a5" }} /> Mid (EMA)</span>
              </div>
            </div>

            {/* Volatility + Sharpe + Sortino */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Volatility (20-day)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["volatility_20"]} colors={["#f59e0b"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Sharpe Ratio</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["sharpe_20"]} colors={["#10b981"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Sortino Ratio</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["sortino_20"]} colors={["#06b6d4"]} height={100} />
                </div>
              </div>
            </div>

            {/* Drawdown + Duration + VaR */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Drawdown</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["drawdown"]} colors={["#ef4444"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">DD Duration (days)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["drawdown_duration"]} colors={["#ef4444"]} height={100} />
                </div>
              </div>
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">VaR (95%)</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart data={data} yKeys={["var_95"]} colors={["#d946ef"]} height={100} />
                </div>
              </div>
            </div>

            {/* Correlation Regime */}
            {regime && regime.length > 0 && (
              <div className="card p-3 space-y-2">
                <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium">Correlation Regime — {signal.replace("_", " ")}</p>
                <div className="rounded-md p-1" style={{ background: "#0a0a12" }}>
                  <AreaChart
                    data={regime}
                    yKeys={["mean_correlation", "percentile_25", "percentile_75"]}
                    colors={["#0ea5a5", "#6b7280", "#6b7280"]}
                    height={150}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#0ea5a5" }} /> Mean Correlation</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#6b7280" }} /> 25th / 75th Percentile</span>
                </div>
                <div className="flex gap-2 mt-1">
                  {["low", "normal", "high"].map(r => {
                    const count = regime.filter(x => x.regime === r).length;
                    const color = r === "high" ? "#ef4444" : r === "low" ? "#10b981" : "#eab308";
                    return (
                      <div key={r} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[9px] text-txt-3 capitalize">{r}: {count} days</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Values */}
            <div className="card p-3 space-y-1">
              <p className="text-[11px] text-txt-3 uppercase tracking-wider font-medium mb-2">Current Values</p>
              <div className="grid grid-cols-3 gap-x-4">
                <div>
                  <IndicatorRow label="Price" value={latest.value} />
                  <IndicatorRow label="SMA 5" value={latest.sma_5} />
                  <IndicatorRow label="SMA 20" value={latest.sma_20} />
                  <IndicatorRow label="EMA 12" value={latest.ema_12} />
                  <IndicatorRow label="EMA 26" value={latest.ema_26} />
                  <IndicatorRow label="BB Upper" value={latest.bb_upper} />
                  <IndicatorRow label="BB Lower" value={latest.bb_lower} />
                </div>
                <div>
                  <IndicatorRow label="MACD" value={latest.macd_line} />
                  <IndicatorRow label="MACD Signal" value={latest.macd_signal} />
                  <IndicatorRow label="MACD Hist" value={latest.macd_histogram} color={latest.macd_histogram > 0 ? "#10b981" : "#ef4444"} />
                  <IndicatorRow label="Stoch %K" value={latest.stoch_k} />
                  <IndicatorRow label="Stoch %D" value={latest.stoch_d} />
                  <IndicatorRow label="ADX" value={latest.adx} />
                  <IndicatorRow label="RSI 14" value={latest.rsi_14} color={latest.rsi_14 > 70 ? "#ef4444" : latest.rsi_14 < 30 ? "#10b981" : "#eab308"} />
                </div>
                <div>
                  <IndicatorRow label="Tenkan" value={latest.tenkan_sen} />
                  <IndicatorRow label="Kijun" value={latest.kijun_sen} />
                  <IndicatorRow label="Williams %R" value={latest.williams_r} />
                  <IndicatorRow label="CCI" value={latest.cci} />
                  <IndicatorRow label="ROC" value={latest.roc} />
                  <IndicatorRow label="Keltner Upper" value={latest.keltner_upper} />
                  <IndicatorRow label="Keltner Lower" value={latest.keltner_lower} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-4 mt-1 pt-1 border-t border-border">
                <div>
                  <IndicatorRow label="Volatility" value={latest.volatility_20} />
                  <IndicatorRow label="Sharpe (20d)" value={latest.sharpe_20} color={latest.sharpe_20 > 1 ? "#10b981" : latest.sharpe_20 < 0 ? "#ef4444" : "#eab308"} />
                </div>
                <div>
                  <IndicatorRow label="Sortino" value={latest.sortino_20} color={latest.sortino_20 > 1 ? "#10b981" : latest.sortino_20 < 0 ? "#ef4444" : "#eab308"} />
                  <IndicatorRow label="VaR (95%)" value={latest.var_95} color="#d946ef" />
                </div>
                <div>
                  <IndicatorRow label="Drawdown" value={latest.drawdown} color="#ef4444" />
                  <IndicatorRow label="DD Duration" value={latest.drawdown_duration} unit="d" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
