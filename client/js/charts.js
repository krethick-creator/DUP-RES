/**
 * Chart.js wrapper for interactive dashboard charts
 */
const Charts = {
  instances: {},

  destroy(id) {
    if (!id) return;
    const instance = this.instances[id];
    if (instance) {
      try { instance.destroy(); } catch (_) { }
      delete this.instances[id];
    }
    // Fallback: Ensure any lingering global Chart.js registry instances are destroyed
    try {
      const globalInstance = Chart.getChart(id);
      if (globalInstance) {
        globalInstance.destroy();
      }
    } catch (_) { }
  },

  destroyAll() {
    Object.keys(this.instances).forEach((id) => this.destroy(id));
  },

  defaults() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      plugins: { legend: { labels: { font: { family: 'Inter' }, padding: 16 } } }
    };
  },

  getCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    return canvas instanceof HTMLCanvasElement ? canvas : null;
  },

  sanitizeNumber(value, fallback = 0) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return fallback;
    return Math.max(0, numericValue);
  },

  sanitizeValues(values) {
    return Array.isArray(values) ? values.map((value) => this.sanitizeNumber(value)) : [];
  },

  sanitizeDatasets(datasets) {
    return (datasets || []).map((dataset) => ({
      ...dataset,
      data: this.sanitizeValues(dataset?.data || [])
    }));
  },

  limitData(labels, datasets) {
    const maxPoints = 20;
    const slicedLabels = Array.isArray(labels) ? labels.slice(-maxPoints) : [];
    let slicedDatasets = [];
    if (Array.isArray(datasets)) {
      slicedDatasets = datasets.map(dataset => ({
        ...dataset,
        data: Array.isArray(dataset?.data) ? dataset.data.slice(-maxPoints) : []
      }));
    }
    return { labels: slicedLabels, datasets: slicedDatasets };
  },

  pie(canvasId, labels, data, colors) {
    this.destroy(canvasId);
    const canvas = this.getCanvas(canvasId);
    if (!canvas) return;
    const maxPoints = 20;
    const sanitizedData = this.sanitizeValues(data).slice(-maxPoints);
    const sanitizedLabels = (Array.isArray(labels) ? labels : []).slice(-maxPoints);
    this.instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: sanitizedLabels,
        datasets: [{
          data: sanitizedData,
          backgroundColor: Array.isArray(colors) && colors.length ? colors : ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
          borderWidth: 0
        }]
      },
      options: { ...this.defaults(), cutout: '65%', plugins: { ...this.defaults().plugins, legend: { position: 'bottom' } } }
    });
  },

  bar(canvasId, labels, datasets) {
    this.destroy(canvasId);
    const canvas = this.getCanvas(canvasId);
    if (!canvas) return;
    const { labels: sanitizedLabels, datasets: sanitizedDatasets } = this.limitData(labels, this.sanitizeDatasets(datasets));
    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels: sanitizedLabels, datasets: sanitizedDatasets },
      options: {
        ...this.defaults(),
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        }
      }
    });
  },

  line(canvasId, labels, datasets) {
    this.destroy(canvasId);
    const canvas = this.getCanvas(canvasId);
    if (!canvas) return;
    const { labels: sanitizedLabels, datasets: sanitizedDatasets } = this.limitData(labels, this.sanitizeDatasets(datasets));
    this.instances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: { labels: sanitizedLabels, datasets: sanitizedDatasets },
      options: {
        ...this.defaults(),
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        },
        elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 6 } }
      }
    });
  },

  radar(canvasId, labels, data) {
    this.destroy(canvasId);
    const canvas = this.getCanvas(canvasId);
    if (!canvas) return;
    const maxPoints = 20;
    const sanitizedData = this.sanitizeValues(data).slice(-maxPoints);
    const sanitizedLabels = (Array.isArray(labels) ? labels : []).slice(-maxPoints);
    this.instances[canvasId] = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: sanitizedLabels,
        datasets: [{
          label: 'Skills',
          data: sanitizedData,
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderColor: '#2563EB',
          borderWidth: 2,
          pointBackgroundColor: '#2563EB'
        }]
      },
      options: {
        ...this.defaults(),
        scales: { r: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } } }
      }
    });
  },

  funnel(canvasId, stages, counts) {
    this.bar(canvasId, stages, [{
      label: 'Candidates',
      data: counts,
      backgroundColor: counts.map((_, i) => `rgba(37, 99, 235, ${1 - i * 0.15})`),
      borderRadius: 6
    }]);
  },

  heatmap(canvasId, data) {
    const values = this.sanitizeValues(data?.values || []);
    const maxValue = Math.max(...values, 1);
    this.bar(canvasId, data?.labels || [], [{
      label: 'Activity',
      data: values,
      backgroundColor: values.map((value) => {
        const intensity = value / maxValue;
        return `rgba(37, 99, 235, ${0.2 + intensity * 0.8})`;
      }),
      borderRadius: 4
    }]);
  },

  progress(canvasId, labels, values) {
    this.bar(canvasId, labels, [{
      label: 'Progress %',
      data: this.sanitizeValues(values),
      backgroundColor: '#2563EB',
      borderRadius: 6
    }]);
  }
};
