import { COMPETENCIES, COMPETENCY_KEYS } from './competencies.js';

let radarChart = null;

/**
 * Render (or replace) the radar chart on the given canvas.
 * @param {string} canvasId
 * @param {Object} scores - { 비판적사고: 72, ... }
 */
export function renderRadarChart(canvasId, scores) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = COMPETENCY_KEYS.map(k => COMPETENCIES[k].label);
  const data   = COMPETENCY_KEYS.map(k => scores[k] ?? 0);
  const colors = COMPETENCY_KEYS.map(k => COMPETENCIES[k].color);

  if (radarChart) {
    radarChart.destroy();
    radarChart = null;
  }

  radarChart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: '내 역량',
        data,
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        borderColor: '#FF6B6B',
        borderWidth: 2.5,
        pointBackgroundColor: colors,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#FF6B6B',
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1200,
        easing: 'easeInOutQuart',
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { family: 'Noto Sans KR', size: 9 },
            color: '#aaa',
            backdropColor: 'transparent',
          },
          pointLabels: {
            font: { family: 'Noto Sans KR', size: 11, weight: '500' },
            color: '#444',
          },
          grid:      { color: 'rgba(0,0,0,0.08)' },
          angleLines: { color: 'rgba(0,0,0,0.08)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw}점`,
          },
        },
      },
    },
  });

  return radarChart;
}

/**
 * Returns keys of top N competencies by score.
 */
export function getTopCompetencies(scores, topN = 2) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([key]) => key);
}
