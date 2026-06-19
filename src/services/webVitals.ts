interface WebVitalsResult {
  LCP: number;
  FID: number;
  CLS: number;
  INP: number;
  FCP: number;
}

interface Metric {
  name: string;
  value: number;
  label: string;
}

let vitalsResult: WebVitalsResult = {
  LCP: 0,
  FID: 0,
  CLS: 0,
  INP: 0,
  FCP: 0,
};

export const WebVitals = {
  getResult(): WebVitalsResult {
    return { ...vitalsResult };
  },

  logResults() {
    const metrics: Metric[] = [
      { name: 'LCP', value: vitalsResult.LCP, label: '最大内容绘制' },
      { name: 'FID', value: vitalsResult.FID, label: '首次输入延迟' },
      { name: 'CLS', value: vitalsResult.CLS, label: '累积布局偏移' },
      { name: 'INP', value: vitalsResult.INP, label: '交互性' },
      { name: 'FCP', value: vitalsResult.FCP, label: '首次内容绘制' },
    ];

    const passed = metrics.filter((m) => {
      if (m.name === 'LCP') return m.value <= 2500;
      if (m.name === 'FID') return m.value <= 100;
      if (m.name === 'CLS') return m.value <= 0.1;
      if (m.name === 'INP') return m.value <= 200;
      if (m.name === 'FCP') return m.value <= 1800;
      return true;
    });

    console.log('Web Vitals Results:', {
      metrics,
      passed: `${passed.length}/${metrics.length}`,
    });
  },

  subscribe() {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            vitalsResult.LCP = entry.startTime;
            break;
          case 'first-input': {
            const timing = entry as unknown as { processingStart: number };
            vitalsResult.FID = timing.processingStart - entry.startTime;
            break;
          }
          case 'layout-shift': {
            const shift = entry as unknown as { value: number };
            vitalsResult.CLS += shift.value;
            break;
          }
          case 'event': {
            const timing = entry as unknown as { duration: number };
            if (timing.duration > vitalsResult.INP) {
              vitalsResult.INP = timing.duration;
            }
            break;
          }
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              vitalsResult.FCP = entry.startTime;
            }
            break;
        }
      }
    });

    observer.observe({
      type: 'largest-contentful-paint',
      buffered: true,
    });
    observer.observe({
      type: 'first-input',
      buffered: true,
    });
    observer.observe({
      type: 'layout-shift',
      buffered: true,
    });
    observer.observe({
      type: 'event',
      buffered: true,
    });
    observer.observe({
      type: 'paint',
      buffered: true,
    });

    window.addEventListener('load', () => {
      setTimeout(() => {
        this.logResults();
      }, 1000);
    });

    return () => {
      observer.disconnect();
    };
  },
};

export const measurePerformance = (name: string, fn: () => void): void => {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
};

export const measureAsyncPerformance = async (name: string, fn: () => Promise<void>): Promise<void> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
};