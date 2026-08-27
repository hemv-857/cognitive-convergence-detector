"""Detect convergence events based on correlation z-scores vs historical baseline."""

import logging

import numpy as np

logger = logging.getLogger(__name__)


def _grade_severity(z_score: float, threshold: float) -> str:
    """Grade severity based on z-score magnitude relative to threshold."""
    ratio = abs(z_score) / threshold
    if ratio >= 2.0:
        return "critical"
    if ratio >= 1.2:
        return "high"
    return "warning"


def detect_convergence(
    correlations_today: dict[tuple[str, str, str], float],
    baselines: dict[tuple[str, str, str], tuple[float, float]],
    level1_threshold: float = 1.5,
    level2_pairs_pct: float = 0.30,
    level3_percentile: float = 95.0,
) -> list[dict]:
    """Identify convergence events.

    Returns list of alert dicts with keys:
        type, severity, manager_a, manager_b, asset_class, correlation, z_score, message
    """
    alerts = []
    pair_alerts = []

    for (m_a, m_b, ac), corr_today in correlations_today.items():
        if (m_a, m_b, ac) not in baselines:
            continue
        baseline_mean, baseline_std = baselines[(m_a, m_b, ac)]
        if baseline_std < 1e-10:
            continue

        z_score = (corr_today - baseline_mean) / baseline_std

        if abs(z_score) > level1_threshold:
            severity = _grade_severity(z_score, level1_threshold)
            alert = {
                "type": "pair_convergence",
                "severity": severity,
                "manager_a": m_a,
                "manager_b": m_b,
                "asset_class": ac,
                "correlation": corr_today,
                "z_score": z_score,
                "message": (
                    f"{'CRITICAL' if severity == 'critical' else 'HIGH' if severity == 'high' else 'Elevated'} "
                    f"convergence: {m_a} & {m_b} {ac} correlation "
                    f"{corr_today:.3f} ({z_score:+.1f}σ from baseline {baseline_mean:.3f})"
                ),
            }
            pair_alerts.append(alert)
            alerts.append(alert)

    # Level 2: >30% of pairs in asset class exceed threshold
    asset_classes = {a["asset_class"] for a in pair_alerts}
    for ac in asset_classes:
        ac_alerts = [a for a in pair_alerts if a["asset_class"] == ac]
        total_pairs = sum(1 for k in correlations_today if k[2] == ac)
        if total_pairs > 0 and len(ac_alerts) / total_pairs > level2_pairs_pct:
            pct = len(ac_alerts) / total_pairs
            severity = "critical" if pct > 0.5 else "high"
            alerts.append({
                "type": "class_convergence",
                "severity": severity,
                "manager_a": None,
                "manager_b": None,
                "asset_class": ac,
                "correlation": float(np.mean([a["correlation"] for a in ac_alerts])),
                "z_score": float(np.mean([a["z_score"] for a in ac_alerts])),
                "message": (
                    f"{'CRITICAL' if severity == 'critical' else 'HIGH'} convergence in {ac}: "
                    f"{len(ac_alerts)}/{total_pairs} pairs above threshold ({pct:.0%})"
                ),
            })

    # Level 3: system-wide convergence
    all_z_scores = [a["z_score"] for a in pair_alerts]
    if all_z_scores:
        p95 = np.percentile(np.abs(all_z_scores), level3_percentile) if len(all_z_scores) > 1 else abs(all_z_scores[0])
        if np.mean(np.abs(all_z_scores)) > p95 * 0.9:
            alerts.append({
                "type": "system_convergence",
                "severity": "critical",
                "manager_a": None,
                "manager_b": None,
                "asset_class": "all",
                "correlation": float(np.mean([a["correlation"] for a in pair_alerts])),
                "z_score": float(np.mean(all_z_scores)),
                "message": (
                    f"CRITICAL system-wide convergence: avg z-score "
                    f"{np.mean(all_z_scores):+.1f}σ across {len(pair_alerts)} pairs"
                ),
            })

    logger.info(f"Detected {len(alerts)} convergence alerts")
    return alerts
