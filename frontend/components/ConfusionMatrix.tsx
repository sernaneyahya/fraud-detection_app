"use client";
import { useEffect, useState } from "react";

export default function ConfusionMatrix() {
  const [matrix, setMatrix] = useState([[0, 0], [0, 0]]);
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    recallFraud: 0,
    auc: 0,
    f1: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.confusion_matrix) setMatrix(data.confusion_matrix);
        if (data.report) {
          setMetrics({
            accuracy: data.report.accuracy,
            recallFraud: data.report["1"]?.recall || 0,
            f1: data.report["1"]?.["f1-score"] || 0,
            auc: data.auc_roc || 0,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-[#131B2C] rounded-xl animate-pulse"></div>;

  return (
    <div className="bg-[#131B2C] p-4 rounded-xl border border-slate-800 shadow-lg flex flex-col h-full">
      {/* Header Compact */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Matrice Confusion
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-mono">
          Model v2.0
        </span>
      </div>

      {/* La Matrice (Plus petite) */}
      <div className="grid grid-cols-2 gap-1.5 relative mb-4 flex-1">
        {/* Labels Axes (Plus discrets) */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          Réel
        </div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 font-bold uppercase tracking-widest">
          Prédit
        </div>

        {matrix.flat().map((value, i) => {
          const isCorrect = i === 0 || i === 3;
          return (
            <div
              key={i}
              className={`h-14 flex flex-col items-center justify-center rounded border border-slate-800/50 transition-all hover:border-slate-600
              ${isCorrect ? "bg-blue-500/5 text-blue-400" : "bg-red-500/5 text-red-400"}`}
            >
              <span className="text-lg font-bold font-mono">{value}</span>
              <span className="text-[7px] uppercase font-bold opacity-50">
                {i === 0 && "Vrais Négatifs"} {i === 1 && "Faux Positifs"}
                {i === 2 && "Faux Négatifs"} {i === 3 && "Vrais Positifs"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Métriques (Liste compacte) */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono border-t border-slate-800 pt-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Accuracy</span>
          <span className="text-green-400">{(metrics.accuracy * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Recall (Fraude)</span>
          <span className="text-orange-400">{(metrics.recallFraud * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">F1-Score</span>
          <span className="text-blue-400">{metrics.f1.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">AUC</span>
          <span className="text-purple-400">{metrics.auc.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}