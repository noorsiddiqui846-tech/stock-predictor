// Hand-drawn price chart (SVG, no library). Colours come from style.css,
// so the chart follows light and dark mode automatically.

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const key in attrs) el.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(el);
  return el;
}

// Pick tidy gridline steps like 1, 2, 2.5, 5, 10 (times a power of ten).
function niceStep(rough) {
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / power;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * power;
}

// Draw the chart inside `wrap`. If `forecast` is given, next week's fan is drawn
// to the right of the past days. Redraws itself when the screen size changes.
function drawPriceChart(wrap, allDays, forecast) {
  // Only the latest 30 days are drawn; `start` is the first one's day number.
  const start = Math.max(0, allDays.length - HISTORY_DAYS);
  const days = allDays.slice(start);
  const steps = forecast ? forecast.steps : [];
  const total = days.length + steps.length; // past days + future days
  const lastIndex = days.length - 1;

  function render() {
    wrap.innerHTML = "";
    const width = Math.max(260, wrap.clientWidth);
    const height = Math.round(Math.min(340, Math.max(230, width * 0.62)));
    const pad = { left: 56, right: 14, top: 22, bottom: 30 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    // Y scale: fit the past closes and the forecast's likely range.
    const values = days.map(d => d.close);
    steps.forEach(s => values.push(s.p10, s.p90));
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (hi - lo < hi * 0.02) { lo -= hi * 0.01; hi += hi * 0.01; } // very flat lines
    const step = niceStep((hi - lo) / 4);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    // Past days share most of the width; next week gets its own wider zone
    // on the right (about a quarter), so the fan is easy to see on a phone.
    const pastW = forecast ? plotW * 0.74 : plotW;
    const futureStep = forecast ? (plotW - pastW) / steps.length : 0;
    const x = i => i <= lastIndex
      ? pad.left + (i / lastIndex) * pastW
      : pad.left + pastW + (i - lastIndex) * futureStep;
    const y = v => pad.top + (1 - (v - lo) / (hi - lo)) * plotH;
    const bottom = pad.top + plotH;

    const first = days[0].close;
    const last = days[lastIndex].close;
    let label = "Line chart of made-up closing prices over " + days.length +
      " weekdays, from " + money(first) + " to " + money(last) + ".";
    if (forecast) {
      const end = steps[steps.length - 1];
      label += " Then a shaded fan for next week: 8 in 10 imagined futures end between " +
        money(end.p10) + " and " + money(end.p90) + ".";
    }
    const svg = svgEl("svg", {
      width: width, height: height, viewBox: "0 0 " + width + " " + height,
      class: "price-chart", role: "img", tabindex: "0",
      "aria-label": label + " Use the left and right arrow keys to read each day."
    }, null);

    // Light background behind the future part, so past and forecast look different.
    if (forecast) {
      svgEl("rect", { x: x(lastIndex), y: pad.top, width: x(total - 1) - x(lastIndex),
        height: plotH, class: "chart-future" }, svg);
    }

    // Watermark: faint "SIMULATED" behind everything.
    const mark = svgEl("text", {
      x: pad.left + plotW / 2, y: pad.top + plotH / 2, class: "chart-watermark",
      "text-anchor": "middle", "dominant-baseline": "middle",
      "font-size": Math.round(Math.min(64, plotW / 6)),
      transform: "rotate(-14 " + (pad.left + plotW / 2) + " " + (pad.top + plotH / 2) + ")",
      "aria-hidden": "true"
    }, svg);
    mark.textContent = "SIMULATED";

    // Horizontal gridlines with $ labels.
    for (let v = lo; v <= hi + step / 2; v += step) {
      svgEl("line", { x1: pad.left, x2: width - pad.right, y1: y(v), y2: y(v), class: "chart-grid" }, svg);
      const t = svgEl("text", { x: pad.left - 8, y: y(v), class: "chart-axis",
        "text-anchor": "end", "dominant-baseline": "middle" }, svg);
      t.textContent = money(v);
    }

    // Week labels under each Monday (Week 7 is next week).
    for (let i = 0; i < total; i++) {
      if ((start + i) % 5 !== 0) continue;
      const t = svgEl("text", { x: x(i), y: height - 10, class: "chart-axis",
        "text-anchor": "middle" }, svg);
      t.textContent = (width < 420 ? "W" : "Week ") + ((start + i) / 5 + 1);
    }

    // Soft area under the past line, then the line itself.
    const points = days.map((d, i) => x(i).toFixed(1) + "," + y(d.close).toFixed(1));
    svgEl("path", { d: "M" + points.join(" L") + " L" + x(lastIndex) + "," + bottom +
      " L" + x(0) + "," + bottom + " Z", class: "chart-area" }, svg);

    // The fan: lighter band = 8 in 10 futures, darker band = 5 in 10, dashed = middle.
    if (forecast) {
      const band = (loKey, hiKey) => {
        const top = steps.map((s, k) => x(days.length + k) + "," + y(s[hiKey]));
        const low = steps.map((s, k) => x(days.length + k) + "," + y(s[loKey])).reverse();
        return "M" + x(lastIndex) + "," + y(last) + " L" + top.join(" L") + " L" + low.join(" L") + " Z";
      };
      svgEl("path", { d: band("p10", "p90"), class: "chart-fan-outer" }, svg);
      svgEl("path", { d: band("p25", "p75"), class: "chart-fan-inner" }, svg);
      const mid = steps.map((s, k) => x(days.length + k) + "," + y(s.p50));
      svgEl("path", { d: "M" + x(lastIndex) + "," + y(last) + " L" + mid.join(" L"), class: "chart-fan-mid" }, svg);

      svgEl("line", { x1: x(lastIndex), x2: x(lastIndex), y1: pad.top, y2: bottom, class: "chart-today" }, svg);
      const t = svgEl("text", { x: width - pad.right, y: pad.top - 7, "text-anchor": "end",
        class: "chart-axis chart-future-label" }, svg);
      t.textContent = "Next week (imagined)";
    }

    svgEl("path", { d: "M" + points.join(" L"), class: "chart-line" }, svg);

    // Rings on days with made-up news.
    days.forEach((d, i) => {
      if (d.news) svgEl("circle", { cx: x(i), cy: y(d.close), r: 5, class: "chart-news" }, svg);
    });

    // Crosshair and focus dot (hidden until you hover, tap or use arrow keys).
    const cross = svgEl("line", { y1: pad.top, y2: bottom, class: "chart-cross", visibility: "hidden" }, svg);
    const dot = svgEl("circle", { r: 5, class: "chart-dot", visibility: "hidden" }, svg);

    // Invisible layer that catches the pointer across the whole plot.
    const hit = svgEl("rect", { x: pad.left - 10, y: 0, width: plotW + 20, height: height, class: "chart-hit" }, svg);

    // Info box above the chart (instead of a floating tooltip, so a finger
    // or the box itself never covers the line on a small phone).
    const tip = document.createElement("div");
    tip.className = "chart-readout";
    tip.setAttribute("aria-live", "polite");
    wrap.append(tip, svg);

    function line(text, className) {
      const div = document.createElement("div");
      div.textContent = text;
      if (className) div.className = className;
      tip.append(div);
      return div;
    }

    let current = -1;
    function show(i) {
      i = Math.max(0, Math.min(total - 1, i));
      current = i;
      tip.innerHTML = "";
      const title = document.createElement("strong");
      title.textContent = dayLabel(start + i);
      tip.append(title);

      let dotY;
      if (i <= lastIndex) {
        const d = days[i];
        const prev = start + i > 0 ? allDays[start + i - 1].close : d.open;
        const change = d.close - prev;
        const pct = (change / prev) * 100;
        const price = line("Close " + money(d.close) + " ");
        const ch = document.createElement("span");
        ch.className = change >= 0 ? "gain" : "loss";
        ch.textContent = (change >= 0 ? "▲ " : "▼ ") + Math.abs(pct).toFixed(1) + "%";
        price.append(ch);
        if (d.news) line("📰 " + d.news.text, "chart-tip-news");
        dot.setAttribute("class", "chart-dot");
        dotY = y(d.close);
      } else {
        const s = steps[i - days.length];
        title.textContent += " (imagined)";
        line("8 in 10 futures: " + money(s.p10) + " to " + money(s.p90));
        line("Middle future: " + money(s.p50), "chart-tip-news");
        dot.setAttribute("class", "chart-dot chart-dot-future");
        dotY = y(s.p50);
      }
      cross.setAttribute("x1", x(i));
      cross.setAttribute("x2", x(i));
      dot.setAttribute("cx", x(i));
      dot.setAttribute("cy", dotY);
      cross.setAttribute("visibility", "visible");
      dot.setAttribute("visibility", "visible");
    }
    function hide() {
      current = -1;
      tip.innerHTML = "";
      line("Hover or tap the chart to read each day" + (forecast ? ", including next week." : "."), "muted");
      cross.setAttribute("visibility", "hidden");
      dot.setAttribute("visibility", "hidden");
    }
    function indexFromPointer(event) {
      const box = svg.getBoundingClientRect();
      const px = event.clientX - box.left - pad.left;
      if (px <= pastW) return Math.round((px / pastW) * lastIndex);
      return lastIndex + Math.round((px - pastW) / futureStep);
    }

    hit.addEventListener("pointermove", e => show(indexFromPointer(e)));
    hit.addEventListener("pointerdown", e => show(indexFromPointer(e)));
    hit.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hide(); });
    svg.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { show(current < 0 ? 0 : current + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { show(current < 0 ? total - 1 : current - 1); e.preventDefault(); }
      else if (e.key === "Escape") hide();
    });
    svg.addEventListener("blur", hide);
    hide(); // start with the hint showing
  }

  render();

  // Redraw when the width changes (phone rotated, window resized).
  let lastWidth = wrap.clientWidth;
  if (wrap._resizeObserver) wrap._resizeObserver.disconnect();
  wrap._resizeObserver = new ResizeObserver(() => {
    if (wrap.clientWidth !== lastWidth) {
      lastWidth = wrap.clientWidth;
      render();
    }
  });
  wrap._resizeObserver.observe(wrap);
}
