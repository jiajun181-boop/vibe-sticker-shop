"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STAMP_TEMPLATES, STAMP_TEMPLATE_CATEGORIES, INK_COLORS } from "@/lib/stampTemplates";
import { drawBorder } from "@/lib/stamp/borders";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StampFontPicker from "./stamp/StampFontPicker";
import StampBorderPicker from "./stamp/StampBorderPicker";
import StampHalftoneUpload from "./stamp/StampHalftoneUpload";

// ── Constants ──────────────────────────────────────────
const CW = 600;
const CH = 600;
const PPI = 200;
const CARD_W_IN = 3.375;
const CARD_H_IN = 2.125;

// ── Helpers ────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fitFontSize(ctx, lines, fontFamily, maxW, maxH) {
  let lo = 8, hi = 200, best = lo;
  const fam = fontFamily.includes(" ") ? `"${fontFamily}"` : fontFamily;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    ctx.font = `bold ${mid}px ${fam}`;
    const widthOk = lines.every((l) => ctx.measureText(l).width <= maxW);
    const totalH = lines.length * mid * 1.25;
    if (widthOk && totalH <= maxH) { best = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  return best;
}

// ── Component ──────────────────────────────────────────
export default function StampEditor({
  shape = "rect",
  widthIn,
  heightIn,
  diameterIn,
  text = "",
  font = "Helvetica",
  color = "#111111",
  onChange,
}) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);
  const halftoneCanvasRef = useRef(null); // Processed halftone canvas

  // Internal state
  const [curveAmount, setCurveAmount] = useState(50);
  const [logoFile, setLogoFile] = useState(null);
  const [logoScale, setLogoScale] = useState(40);
  const [borderId, setBorderId] = useState("none");
  const [halftoneEnabled, setHalftoneEnabled] = useState(false);
  const [halftoneIntensity, setHalftoneIntensity] = useState("medium");
  const [templateCat, setTemplateCat] = useState("business");
  const [showRef, setShowRef] = useState(false);
  const [renderTick, setRenderTick] = useState(0); // Force re-render after halftone processes

  // Notify parent of all state changes
  const notifyParent = useCallback(
    (patch) => {
      if (!onChange) return;
      onChange({
        color: patch.color ?? undefined,
        text: patch.text ?? undefined,
        font: patch.font ?? undefined,
        curveAmount: patch.curveAmount ?? curveAmount,
        logoFile: patch.logoFile !== undefined ? patch.logoFile : logoFile,
        template: patch.template ?? undefined,
        border: patch.border ?? borderId,
        halftoneEnabled: patch.halftoneEnabled ?? halftoneEnabled,
        halftoneIntensity: patch.halftoneIntensity ?? halftoneIntensity,
      });
    },
    [onChange, curveAmount, logoFile, borderId, halftoneEnabled, halftoneIntensity],
  );

  // Load logo image when URL changes (for non-halftone mode)
  useEffect(() => {
    if (!logoFile?.url) { logoImgRef.current = null; return; }
    if (halftoneEnabled) return; // Halftone component handles its own image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { logoImgRef.current = img; };
    img.src = logoFile.url;
  }, [logoFile?.url, halftoneEnabled]);

  // ── Canvas render ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);

    const cx = CW / 2;
    const cy = CH / 2;
    const isRound = shape === "round";
    const stampW = isRound ? (diameterIn || 1) * PPI : (widthIn || 1) * PPI;
    const stampH = isRound ? (diameterIn || 1) * PPI : (heightIn || 1) * PPI;
    const radius = isRound ? stampW / 2 : 0;

    // ── 1. Draw stamp boundary ──
    ctx.save();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    if (isRound) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(cx - stampW / 2, cy - stampH / 2, stampW, stampH, 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // ── 2. Draw decorative border ──
    drawBorder(ctx, borderId, shape, cx, cy, stampW, stampH, radius, color);

    // ── 3. Render image/logo ──
    const halftoneCanvas = halftoneCanvasRef.current;
    const logoImg = logoImgRef.current;
    const imgSource = halftoneEnabled && halftoneCanvas ? halftoneCanvas : logoImg;

    if (imgSource) {
      const scale = logoScale / 100;
      const maxDim = isRound ? radius * 0.8 : Math.min(stampW, stampH) * 0.4;
      const imgW = maxDim * scale;
      const imgH = halftoneEnabled
        ? imgW // Halftone is always square
        : (imgSource.height / imgSource.width) * imgW;
      ctx.globalAlpha = halftoneEnabled ? 1 : 0.85;
      ctx.drawImage(imgSource, cx - imgW / 2, cy - imgH / 2, imgW, imgH);
      ctx.globalAlpha = 1;
    }

    // ── 4. Render text ──
    const lines = (text || "").split("\n").filter((l) => l.trim());
    if (lines.length === 0) lines.push(" ");
    const [r, g, b] = hexToRgb(color);
    const fam = font.includes(" ") ? `"${font}"` : font;

    if (isRound && curveAmount > 5) {
      const curve = curveAmount / 100;
      const textRadius = radius * 0.78;

      // Line 1 — top arc
      if (lines[0]) {
        const chars = lines[0].split("");
        const fontSize = fitFontSize(ctx, [lines[0]], font, textRadius * 1.6, textRadius * 0.4);
        ctx.font = `bold ${fontSize}px ${fam}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const totalAngle = Math.PI * curve * 0.8;
        const startAngle = -Math.PI / 2 - totalAngle / 2;
        const angleStep = chars.length > 1 ? totalAngle / (chars.length - 1) : 0;

        chars.forEach((ch, i) => {
          const a = startAngle + i * angleStep;
          const x = cx + Math.cos(a) * textRadius;
          const y = cy + Math.sin(a) * textRadius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        });
      }

      // Line 2 — bottom arc (reversed)
      if (lines[1]) {
        const chars = lines[1].split("");
        const fontSize = fitFontSize(ctx, [lines[1]], font, textRadius * 1.4, textRadius * 0.35);
        ctx.font = `bold ${fontSize}px ${fam}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const innerRadius = textRadius * 0.75;
        const totalAngle = Math.PI * curve * 0.7;
        const startAngle = Math.PI / 2 + totalAngle / 2;
        const angleStep = chars.length > 1 ? totalAngle / (chars.length - 1) : 0;

        chars.forEach((ch, i) => {
          const a = startAngle - i * angleStep;
          const x = cx + Math.cos(a) * innerRadius;
          const y = cy + Math.sin(a) * innerRadius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a - Math.PI / 2);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        });
      }

      // Line 3+ — center (straight)
      if (lines.length > 2) {
        const remaining = lines.slice(2);
        const fs = fitFontSize(ctx, remaining, font, radius * 1.2, radius * 0.5);
        ctx.font = `bold ${fs}px ${fam}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const lh = fs * 1.2;
        const startY = cy - ((remaining.length - 1) * lh) / 2;
        remaining.forEach((line, i) => ctx.fillText(line, cx, startY + i * lh));
      }
    } else {
      // Straight multi-line (rect stamps or zero curve)
      const margin = isRound ? radius * 0.3 : stampW * 0.08;
      const maxW = (isRound ? radius * 1.4 : stampW) - margin * 2;
      const maxH = (isRound ? radius * 1.4 : stampH) - margin * 2;
      const fs = fitFontSize(ctx, lines, font, maxW, maxH);
      ctx.font = `bold ${fs}px ${fam}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lh = fs * 1.25;
      const totalH = lines.length * lh;
      const startY = cy - totalH / 2 + lh / 2;
      lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lh));
    }

    // ── 5. Ink texture noise ──
    try {
      const imgData = ctx.getImageData(0, 0, CW * dpr, CH * dpr);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) continue;
        const dr = Math.abs(d[i] - r);
        const dg = Math.abs(d[i + 1] - g);
        const db = Math.abs(d[i + 2] - b);
        if (dr + dg + db < 150) {
          const noise = (Math.random() - 0.5) * 12;
          d[i] = Math.max(0, Math.min(255, d[i] + noise));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
          if (Math.random() < 0.03) d[i + 3] = Math.max(120, d[i + 3] - 40);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Canvas tainted — skip texture
    }

    // ── 6. Size reference ──
    if (showRef) {
      const cardW = CARD_W_IN * PPI;
      const cardH = CARD_H_IN * PPI;
      const refX = CW - cardW - 10;
      const refY = CH - cardH - 30;
      ctx.save();
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(refX, refY, cardW, cardH);
      ctx.setLineDash([]);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(t("stamp.referenceCard"), CW - 12, CH - 10);
      ctx.restore();
    }
  }, [text, font, color, shape, widthIn, heightIn, diameterIn, curveAmount, logoFile, logoScale, showRef, borderId, halftoneEnabled, renderTick, t]);

  // ── Handlers ──────────────────────────────────────
  function handleColorSelect(hex) {
    notifyParent({ color: hex });
  }

  function handleFontSelect(family) {
    notifyParent({ font: family });
  }

  function handleBorderSelect(id) {
    setBorderId(id);
    notifyParent({ border: id });
  }

  function handleCurveChange(val) {
    setCurveAmount(val);
    notifyParent({ curveAmount: val });
  }

  function handleTemplateSelect(tmpl) {
    if (tmpl.curve != null) setCurveAmount(tmpl.curve);
    if (tmpl.border) setBorderId(tmpl.border);
    if (onChange) {
      onChange({
        color: tmpl.color,
        text: tmpl.text,
        font: tmpl.font,
        curveAmount: tmpl.curve ?? curveAmount,
        logoFile,
        template: tmpl.id,
        border: tmpl.border || borderId,
        halftoneEnabled,
        halftoneIntensity,
      });
    }
  }

  function handleLogoUpload(file) {
    setLogoFile(file);
    notifyParent({ logoFile: file });
  }

  function handleLogoRemove() {
    setLogoFile(null);
    logoImgRef.current = null;
    halftoneCanvasRef.current = null;
    setHalftoneEnabled(false);
    notifyParent({ logoFile: null, halftoneEnabled: false });
  }

  function handleHalftoneToggle(enabled) {
    setHalftoneEnabled(enabled);
    if (!enabled) halftoneCanvasRef.current = null;
    setRenderTick((t) => t + 1);
    notifyParent({ halftoneEnabled: enabled });
  }

  function handleHalftoneIntensityChange(intensity) {
    setHalftoneIntensity(intensity);
    setRenderTick((t) => t + 1);
    notifyParent({ halftoneIntensity: intensity });
  }

  // ── Render ────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Canvas preview */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("stamp.preview")}</p>
          <button
            type="button"
            onClick={() => setShowRef((v) => !v)}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${showRef ? "bg-[var(--color-gray-900)] text-[#fff] border-[var(--color-gray-900)]" : "text-[var(--color-gray-500)] border-[var(--color-gray-300)] hover:border-[var(--color-gray-500)]"}`}
          >
            {t("stamp.sizeReference")}
          </button>
        </div>
        <div className="relative mx-auto max-w-[280px] sm:max-w-[400px] lg:max-w-[600px]" style={{ aspectRatio: "1/1" }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%" }}
            className="rounded-xl bg-white"
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-[var(--color-gray-400)]">{t("stamp.previewHint")}</p>
      </div>

      {/* Font selector */}
      <StampFontPicker selected={font} onSelect={handleFontSelect} />

      {/* Ink color presets */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">{t("stamp.inkColor")}</p>
        <div className="flex gap-2">
          {INK_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleColorSelect(c.hex)}
              title={t(c.labelKey)}
              className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${color === c.hex ? "border-[var(--color-gray-900)] ring-2 ring-gray-300 scale-110" : "border-[var(--color-gray-200)]"}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Border selector */}
      <StampBorderPicker selected={borderId} color={color} onSelect={handleBorderSelect} />

      {/* Curve slider (round stamps only) */}
      {shape === "round" && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("stamp.curveAmount")}</p>
            <span className="text-xs text-[var(--color-gray-500)]">{curveAmount}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={curveAmount}
            onChange={(e) => handleCurveChange(Number(e.target.value))}
            className="mt-1 w-full accent-gray-900"
          />
          <p className="text-[10px] text-[var(--color-gray-400)]">{t("stamp.curveHint")}</p>
        </div>
      )}

      {/* Image upload with halftone */}
      <StampHalftoneUpload
        logoFile={logoFile}
        logoScale={logoScale}
        halftoneEnabled={halftoneEnabled}
        halftoneIntensity={halftoneIntensity}
        color={color}
        onLogoUpload={handleLogoUpload}
        onLogoRemove={handleLogoRemove}
        onLogoScaleChange={setLogoScale}
        onHalftoneToggle={handleHalftoneToggle}
        onHalftoneIntensityChange={handleHalftoneIntensityChange}
        halftoneDataRef={halftoneCanvasRef}
      />

      {/* Template selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">{t("stamp.templates")}</p>
        <div
          className="flex gap-1 mb-2 overflow-x-auto pb-1"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {STAMP_TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setTemplateCat(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${templateCat === cat ? "bg-[var(--color-gray-900)] text-[#fff]" : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-200)]"}`}
            >
              {t(`stamp.templateCat.${cat}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STAMP_TEMPLATES.filter((tmpl) => tmpl.cat === templateCat).map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleTemplateSelect(tmpl)}
              className="rounded-xl border border-[var(--color-gray-200)] px-2 py-2 text-left hover:border-[var(--color-gray-400)] hover:bg-[var(--color-gray-50)] transition-colors"
            >
              <span className="block text-xs font-semibold text-[var(--color-gray-900)]">{tmpl.label}</span>
              <span className="block mt-0.5 text-[10px] text-[var(--color-gray-500)] line-clamp-1">{tmpl.text.split("\n")[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
