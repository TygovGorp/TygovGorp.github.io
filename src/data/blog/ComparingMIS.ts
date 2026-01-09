export default {
    title: 'Comparing Multiple Importance Sampling Strategies',
    slug: 'comparing-mis-strategies',
    date: '2026-01-16',
    excerpt: 'An comparison of MIS technique combinations in path tracing across various scenes, analyzing render time and perceptual error to determine practical recommendations.',
    content: `
<h1>Introduction</h1>

<p>Path tracing with naive sampling strategies suffers from high variance this causes effects like fireflies, noise, and slow convergence. While Multiple Importance Sampling (MIS) is the standard solution, choosing which techniques to combine and how to budget samples remains poorly documented outside research papers.</p>

<p>This article compares different MIS strategy combinations across four test scenes, measuring both render time and perceptual error (FLIP metric). The goal: understand when the added complexity of techniques like split-lobe BSDF sampling or environment map sampling actually pays off.</p>

<p><strong>Key question</strong>: Does combining more sampling strategies always improve results, or do diminishing returns make simpler approaches more practical?</p>

<h1>Background: Multiple Importance Sampling</h1>

<h2>The Variance Problem</h2>

<p>Consider rendering a scene with a small, bright light source. BSDF sampling (shooting rays based on material properties) will rarely hit the light by chance, producing mostly black samples with occasional extreme values (fireflies). Light sampling (shooting rays directly at lights) solves this but fails for glossy reflections where the BSDF is highly directional.</p>

<p>Neither strategy alone handles both cases efficiently.</p>

<h2>The MIS Solution</h2>

<p>MIS combines multiple sampling strategies with optimal weights that minimize variance. Given two PDFs p₁(x) and p₂(x), the balance heuristic computes:</p>

<p><strong>w₁(x) = (n₁ · p₁(x)) / (n₁ · p₁(x) + n₂ · p₂(x))</strong></p>

<p>This weights each sample by its relative "reliability" this makes it so strategies that would have sampled this direction with high probability get more credit. The power heuristic (β=2) often performs slightly better in practice.</p>

<p>The crucial insight: MIS automatically adapts to scene conditions. When BSDF sampling works well, it gets high weight. When light sampling is better, it dominates. Neither strategy can "break" the estimate.</p>

<h1>Sampling Techniques Tested</h1>

<h2>Core Strategies</h2>

<p><strong>BSDF Sampling</strong>: Sample directions based on material BRDF/BTDF. Works well for glossy reflections and diffuse surfaces, poor for small/distant light sources.</p>

<p><strong>Light Sampling (Next Event Estimation)</strong>: Explicitly sample light sources each bounce. Excels with small emitters, struggles with large area lights or environment lighting.</p>

<p><strong>Environment Sampling</strong>: Sample the environment map as an area light. Essential for outdoor scenes or dominant distant lighting, but adds overhead.</p>

<h2>Split-Lobe BSDF Sampling</h2>

<p>Materials like GGX have distinct diffuse and specular lobes with very different PDF shapes. Unified BSDF sampling must compromise between them. Split-lobe sampling treats them as separate techniques:</p>

<ul>
<li>Sample diffuse lobe with cosine weighting</li>
<li>Sample specular lobe with GGX distribution</li>
<li>Combine via MIS</li>
</ul>

<p>This should reduce variance for materials with strong lobe separation (rough metals, coated surfaces) but adds overhead.</p>

<h1>Experimental Methodology</h1>

<h2>Test Scenes</h2>

<p><strong>Scene 1: Veach MIS</strong> (Classic MIS test case)</p>
<ul>
<li>Tests grazing angle sampling and challenging light transport</li>
<li>Multiple plates with varying roughness under point lights</li>
<li>Gold standard for validating MIS implementations</li>
</ul>

<p><strong>Scene 2: Sponza</strong> (Architectural interior)</p>
<ul>
<li>Indirect lighting dominates (sunlight through openings)</li>
<li>Tests environment sampling effectiveness</li>
<li>Large area lights (sky dome) vs direct light sampling</li>
</ul>

<p><strong>Scene 3: Bistro Exterior</strong> (Outdoor urban scene)</p>
<ul>
<li>Strong directional sunlight + environment</li>
<li>Tests environment sampling overhead vs benefits</li>
<li>Many rough/metallic materials (split-lobe test)</li>
</ul>

<p><strong>Scene 4: Bistro Interior</strong> (Complex indoor lighting)</p>
<ul>
<li>Multiple small emitters + indirect bounces</li>
<li>Tests light sampling efficiency</li>
<li>Dark/bright regions test variance reduction</li>
</ul>

<p>Each scene stresses different aspects: Veach validates correctness, Sponza tests indirect lighting, Bistro tests real-world complexity.</p>

<h2>Evaluation Metrics</h2>

<p><strong>Render Time</strong>: Wall-clock time to render at target sample counts (1, 4, 16, 64, 256 SPP)</p>

<p><strong>FLIP Error</strong>: Perceptual image difference vs reference (10000 SPP ground truth)</p>
<ul>
<li>Lower is better</li>
<li>Captures visible artifacts better than MSE/RMSE</li>
<li>Curves show convergence rate</li>
</ul>

<h2>Sample Budget Allocation</h2>

<p>A critical question: when using split-lobe sampling (2 techniques instead of 1), how do we allocate samples?</p>

<p><strong>Equal SPP</strong>: Each lobe gets N samples (2N total vs N for unified)</p>
<ul>
<li>Shows quality ceiling (what if performance doesn't matter?)</li>
<li>Fair comparison of variance reduction</li>
</ul>

<p><strong>Equal Cost</strong>: Split N samples across both lobes (N/2 each)</p>
<ul>
<li>Same computational cost as unified BSDF</li>
<li>Shows practical value at fixed budget</li>
</ul>

<p>Both tests are necessary: Equal SPP shows if the technique fundamentally helps, Equal Cost shows if it's worth using.</p>

<h2>MIS Weighting</h2>

<p>All tests use the balance heuristic for combining techniques. When combining 3+ strategies (BSDF + Light + Env), each sample is weighted by:</p>

<p><strong>w_i(x) = (n_i · p_i(x)) / Σⱼ(n_j · p_j(x))</strong></p>

<p>Where i ranges over all active sampling techniques for that path vertex.</p>

<h1>Strategy Combinations Tested</h1>

<p>We test 8 configurations per scene:</p>

<h2>Baseline</h2>
<ul>
<li><strong>BSDF only</strong>: Pure importance sampling, no NEE</li>
</ul>

<h2>Two-Technique MIS</h2>
<ul>
<li><strong>BSDF + Light</strong>: Standard path tracing with NEE</li>
<li><strong>BSDF + Env</strong>: BSDF with environment sampling</li>
<li><strong>BSDF + Light + Env</strong>: All three combined</li>
</ul>

<h2>Split-Lobe Variants (Equal SPP)</h2>
<ul>
<li><strong>Split BSDF only</strong>: Separate diffuse/specular (2× cost)</li>
<li><strong>Split + Light</strong>: Split-lobe with light sampling</li>
<li><strong>Split + Env</strong>: Split-lobe with environment sampling</li>
<li><strong>Split + Light + Env</strong>: All techniques combined (4 strategies)</li>
</ul>

<h2>Split-Lobe Variants (Equal Cost)</h2>
<p>(Same combinations but at matched computational cost)</p>

<h1>Predictions</h1>

<p>Before analyzing results, here are my hypotheses:</p>

<p>1: BSDF + Light will dominate Veach and Bistro Interior (small emitters)<br>
2: Environment sampling will show large gains in Sponza and Bistro Exterior, minimal elsewhere<br>
3: Split-lobe will reduce variance for rough metals in Bistro scenes but add overhead in Veach<br>
4: At low SPP (1-4), simpler strategies will outperform due to per-sample overhead<br>
5: Equal-cost split-lobe will rarely justify its complexity vs unified BSDF</p>

<h1>Results and Analysis</h1>

<style>
.comparison-section {
    margin: 3rem 0;
    width: 98vw;
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -50vw;
    margin-right: -49vw;
    padding: 0 1rem;
}

.scene-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    justify-content: center;
}

.scene-button {
    padding: 0.75rem 1.5rem;
    background: #111;
    border: 1px solid #222;
    border-radius: 6px;
    color: #888;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    font-family: inherit;
}

.scene-button:hover {
    border-color: #444;
    color: #bbb;
}

.scene-button.active {
    background: #1a1a1a;
    border-color: #fff;
    color: #fff;
}

.matrix-container {
    background: #111;
    border: 1px solid #222;
    border-radius: 8px;
    padding: 2rem;
    overflow-x: auto;
    max-width: 100%;
}

.matrix-grid {
    display: grid;
    grid-template-columns: 180px repeat(2, 1fr) 110px 110px;
    gap: 1rem;
    min-width: 1000px;
}

.matrix-header {
    font-size: 0.85rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1rem 0.5rem;
    text-align: center;
}

.matrix-header:first-child {
    text-align: left;
}

.technique-label {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: #fff;
    background: #0a0a0a;
    border-radius: 6px;
}

.image-cell {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #222;
    cursor: pointer;
    transition: all 0.3s ease;
}

.image-cell:hover {
    border-color: #444;
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    z-index: 10;
}

.image-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

..metric-cell {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.8rem;
    color: #bbb;
    background: #0a0a0a;
    border-radius: 6px;
}

.metric-header {
    font-weight: 600;
    color: #888;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.metric-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    border-bottom: 1px solid #1a1a1a;
}

.metric-value:last-child {
    border-bottom: none;
}

.metric-value-label {
    color: #666;
    font-size: 0.75rem;
}

.metric-value-number {
    color: #fff;
    font-weight: 600;
    font-size: 0.85rem;
}

.metric-value-number.highlight {
    color: #4a9eff;
    font-size: 0.95rem;
}

/* Remove old tooltip styles */
.metric-primary,
.metric-label,
.metric-tooltip {
    display: none;
}

.tooltip-row {
    display: flex;
    justify-content: space-between;
    padding: 0.35rem 0;
    font-size: 0.8rem;
    border-bottom: 1px solid #222;
}

.tooltip-row:last-child {
    border-bottom: none;
}

.tooltip-label {
    color: #888;
}

.tooltip-value {
    color: #bbb;
    font-weight: 600;
    margin-left: 1rem;
}

.reference-row {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #222;
}

.reference-image-container {
    grid-column: 2 / -1;
    display: flex;
    justify-content: center;
}

.reference-image {
    max-width: 600px;
    width: 100%;
    border-radius: 6px;
    border: 1px solid #333;
}

.winner-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #2a9d2a;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    z-index: 5;
}

.scene-data {
    display: none;
}

.scene-data.active {
    display: contents;
}

@media (max-width: 1200px) {
    .matrix-grid {
        grid-template-columns: 150px repeat(2, 1fr) 100px 100px;
        gap: 0.75rem;
    }
    
    .technique-label {
        font-size: 0.8rem;
        padding: 0.5rem;
    }
    
    .metric-cell {
        font-size: 0.75rem;
        padding: 0.4rem;
    }
    
    .metric-primary {
        font-size: 0.9rem;
    }
}
</style>

<div class="comparison-section">
    <div class="scene-selector">
        <button class="scene-button active" onclick="switchScene('veach')">Veach MIS</button>
        <button class="scene-button" onclick="switchScene('sponza')">Sponza</button>
        <button class="scene-button" onclick="switchScene('bistro-exterior')">Bistro Exterior</button>
        <button class="scene-button" onclick="switchScene('bistro-interior')">Bistro Interior</button>
    </div>

    <div class="matrix-grid">
    <!-- Veach Scene Data -->
    <div class="scene-data active" id="veach-data">
        <!-- Reference -->
        <div class="reference-row">
            <div class="technique-label">Reference</div>
            <div class="reference-image-container">
                <img class="reference-image" src="/media/blog/ComparingMIS/VeachRef.bmp" alt="Veach Reference">
            </div>
        </div>

        <!-- Headers -->
        <div class="matrix-header">Technique</div>
        <div class="matrix-header">Rendered Output</div>
        <div class="matrix-header">FLIP Error Map</div>
        <div class="matrix-header">Time</div>
        <div class="matrix-header">FLIP</div>

        <!-- BSDF Only -->
        <div class="technique-label">BSDF Only</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Only-S.png" alt="BSDF Only">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Only-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">2.63ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">2.56ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">2.72ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">2.64ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.150</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.350</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.136</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.581</span>
            </div>
        </div>

        <!-- BSDF + Light -->
        <div class="technique-label">BSDF + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Light-S.png" alt="BSDF+Light">
            <div class="winner-badge">Best</div>
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">7.54ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">7.60ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">7.56ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">7.57ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.120</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.288</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.108</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.503</span>
            </div>
        </div>

        <!-- BSDF + Env -->
        <div class="technique-label">BSDF + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Env-S.png" alt="BSDF+Env">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">2.67ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">2.77ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">2.58ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">2.67ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.149</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.350</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.136</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.580</span>
            </div>
        </div>

        <!-- BSDF + Light + Env -->
        <div class="technique-label">BSDF + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Light_Env-S.png" alt="All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-BSDF_Light_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">5.22ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">5.32ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">5.30ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">5.28ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.120</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.288</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.108</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.503</span>
            </div>
        </div>

        <!-- Split BSDF -->
        <div class="technique-label">Split-Lobe BSDF</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-S.png" alt="Split BSDF">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">1.69ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">1.86ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">1.90ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">1.82ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.160</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.383</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.153</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.594</span>
            </div>
        </div>

        <!-- Split + Light -->
        <div class="technique-label">Split + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Light-S.png" alt="Split+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">4.92ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">5.14ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">4.99ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">5.02ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.120</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.293</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.108</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.505</span>
            </div>
        </div>

        <!-- Split + Env -->
        <div class="technique-label">Split + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Env-S.png" alt="Split+Env">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">1.79ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">1.91ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">1.94ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">1.88ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.160</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.383</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.153</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.594</span>
            </div>
        </div>

        <!-- Split + Light + Env -->
        <div class="technique-label">Split + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Light-Env-S.png" alt="Split All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Veach-Split_BSDF-Light-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">5.06ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">5.31ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">5.11ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">5.16ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.120</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.293</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.108</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.503</span>
            </div>
        </div>
    </div>

    <!-- Sponza Scene Data -->
    <div class="scene-data" id="sponza-data">
        <!-- Reference -->
        <div class="reference-row">
            <div class="technique-label">Reference</div>
            <div class="reference-image-container">
                <img class="reference-image" src="/media/blog/ComparingMIS/SponzaRef.bmp" alt="Sponza Reference">
            </div>
        </div>

        <!-- Headers -->
        <div class="matrix-header">Technique</div>
        <div class="matrix-header">Rendered Output</div>
        <div class="matrix-header">FLIP Error Map</div>
        <div class="matrix-header">Time</div>
        <div class="matrix-header">FLIP</div>

        <!-- BSDF Only -->
        <div class="technique-label">BSDF Only</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Only-S.png" alt="BSDF Only">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Only-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">15.73ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">16.26ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">15.67ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">15.89ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.640</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.828</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.634</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.954</span>
            </div>
        </div>

        <!-- BSDF + Light -->
        <div class="technique-label">BSDF + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Light-S.png" alt="BSDF+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">19.73ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">20.05ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">19.64ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">19.81ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.639</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.827</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.632</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.953</span>
            </div>
        </div>

        <!-- BSDF + Env -->
        <div class="technique-label">BSDF + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Env-S.png" alt="BSDF+Env">
            <div class="winner-badge">Best</div>
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">27.94ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">27.84ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">28.01ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">27.93ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.592</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.741</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.573</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.865</span>
            </div>
        </div>

        <!-- BSDF + Light + Env -->
        <div class="technique-label">BSDF + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Light_Env-S.png" alt="All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-BSDF_Light_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">33.00ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">33.06ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">32.93ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">33.00ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.590</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.738</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.571</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.862</span>
            </div>
        </div>

        <!-- Split BSDF -->
        <div class="technique-label">Split-Lobe BSDF</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-S.png" alt="Split BSDF">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">21.58ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">21.51ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">21.71ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">21.60ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.607</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.769</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.591</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.901</span>
            </div>
        </div>

        <!-- Split + Light -->
        <div class="technique-label">Split + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Light-S.png" alt="Split+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">23.60ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">23.54ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">23.65ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">23.60ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.606</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.767</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.589</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.898</span>
            </div>
        </div>

        <!-- Split + Env -->
        <div class="technique-label">Split + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Env-S.png" alt="Split+Env">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">41.18ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">41.27ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">41.13ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">41.19ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.585</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.733</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.565</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.860</span>
            </div>
        </div>

        <!-- Split + Light + Env -->
        <div class="technique-label">Split + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Light-Env-S.png" alt="Split All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Sponza-Split_BSDF-Light-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">41.68ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">41.53ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">41.63ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">41.63ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.492</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.608</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.446</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.744</span>
            </div>
        </div>
    </div>

    <!-- Bistro Exterior Scene Data -->
    <div class="scene-data" id="bistro-exterior-data">
        <!-- Reference -->
        <div class="reference-row">
            <div class="technique-label">Reference</div>
            <div class="reference-image-container">
                <img class="reference-image" src="/media/blog/ComparingMIS/Bistro_ExteriorRef.bmp" alt="Bistro Exterior Reference">
            </div>
        </div>

        <!-- Headers -->
        <div class="matrix-header">Technique</div>
        <div class="matrix-header">Rendered Output</div>
        <div class="matrix-header">FLIP Error Map</div>
        <div class="matrix-header">Time</div>
        <div class="matrix-header">FLIP</div>

        <!-- BSDF Only -->
        <div class="technique-label">BSDF Only</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Only-S.png" alt="BSDF Only">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Only-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">70.83ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">70.45ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">70.43ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">70.57ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.492</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.618</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.453</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.766</span>
            </div>
        </div>

        <!-- BSDF + Light -->
        <div class="technique-label">BSDF + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Light-S.png" alt="BSDF+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">77.22ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">77.75ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">77.40ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">77.46ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.491</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.616</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.451</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.764</span>
            </div>
        </div>

        <!-- BSDF + Env -->
        <div class="technique-label">BSDF + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Env-S.png" alt="BSDF+Env">
            <div class="winner-badge">Best</div>
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">86.90ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">87.50ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">87.10ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">87.17ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.466</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.578</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.426</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.723</span>
            </div>
        </div>

        <!-- BSDF + Light + Env -->
        <div class="technique-label">BSDF + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Light_Env-S.png" alt="All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-BSDF_Light_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">103.67ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">103.22ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">103.29ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">103.39ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.464</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.576</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.423</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.722</span>
            </div>
        </div>

        <!-- Split BSDF -->
        <div class="technique-label">Split-Lobe BSDF</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-S.png" alt="Split BSDF">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">105.85ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">105.95ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">105.29ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">105.70ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.444</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.546</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.397</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.701</span>
            </div>
        </div>

        <!-- Split + Light -->
        <div class="technique-label">Split + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Light-S.png" alt="Split+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">112.89ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">113.22ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">113.60ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">113.24ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.443</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.544</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.396</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.699</span>
            </div>
        </div>

        <!-- Split + Env -->
        <div class="technique-label">Split + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Env-S.png" alt="Split+Env">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">125.03ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">125.66ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">124.88ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">125.19ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.430</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.523</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.382</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.675</span>
            </div>
        </div>

        <!-- Split + Light + Env -->
        <div class="technique-label">Split + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Light-Env-S.png" alt="Split All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Exterior-Split_BSDF-Light-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">137.49ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">138.00ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">137.26ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">137.58ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.440</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.519</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.390</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.664</span>
            </div>
        </div>
    </div>

    <!-- Bistro Interior Scene Data -->
    <div class="scene-data" id="bistro-interior-data">
        <!-- Reference -->
        <div class="reference-row">
            <div class="technique-label">Reference</div>
            <div class="reference-image-container">
                <img class="reference-image" src="/media/blog/ComparingMIS/Bistro_InteriorRef.bmp" alt="Bistro Interior Reference">
            </div>
        </div>

        <!-- Headers -->
        <div class="matrix-header">Technique</div>
        <div class="matrix-header">Rendered Output</div>
        <div class="matrix-header">FLIP Error Map</div>
        <div class="matrix-header">Time</div>
        <div class="matrix-header">FLIP</div>

        <!-- BSDF Only -->
        <div class="technique-label">BSDF Only</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Only-S.png" alt="BSDF Only">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Only-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">77.03ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">76.60ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">76.79ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">76.81ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.267</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.334</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.225</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.452</span>
            </div>
        </div>

        <!-- BSDF + Light -->
        <div class="technique-label">BSDF + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Light-S.png" alt="BSDF+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">49.60ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">50.44ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">48.73ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">49.59ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.294</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.370</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.252</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.491</span>
            </div>
        </div>

        <!-- BSDF + Env -->
        <div class="technique-label">BSDF + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Env-S.png" alt="BSDF+Env">
            <div class="winner-badge">Best</div>
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">53.83ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">64.04ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">53.90ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">57.26ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.269</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.335</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.226</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.452</span>
            </div>
        </div>

        <!-- BSDF + Light + Env -->
        <div class="technique-label">BSDF + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Light_Env-S.png" alt="All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-BSDF_Light_Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">80.77ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">80.55ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">81.76ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">81.03ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.267</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.334</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.225</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.452</span>
            </div>
        </div>

        <!-- Split BSDF -->
        <div class="technique-label">Split-Lobe BSDF</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-S.png" alt="Split BSDF">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">53.07ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">52.92ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">53.24ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">53.08ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.285</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.357</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.239</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.485</span>
            </div>
        </div>

        <!-- Split + Light -->
        <div class="technique-label">Split + Light</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Light-S.png" alt="Split+Light">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Light-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">75.54ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">75.97ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">76.12ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">75.88ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.281</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.353</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.236</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.480</span>
            </div>
        </div>

        <!-- Split + Env -->
        <div class="technique-label">Split + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Env-S.png" alt="Split+Env">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">79.98ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">79.66ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">79.71ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">79.78ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.273</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.341</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.228</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.467</span>
            </div>
        </div>

        <!-- Split + Light + Env -->
        <div class="technique-label">Split + Light + Env</div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Light-Env-S.png" alt="Split All">
        </div>
        <div class="image-cell">
            <img src="/media/blog/ComparingMIS/Bistro_Interior-Split_BSDF-Light-Env-F.png" alt="FLIP">
        </div>
        <div class="metric-cell">
            <div class="metric-header">Time</div>
            <div class="metric-value">
                <span class="metric-value-label">Run 1:</span>
                <span class="metric-value-number">101.32ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 2:</span>
                <span class="metric-value-number">101.90ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Run 3:</span>
                <span class="metric-value-number">101.10ms</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Average:</span>
                <span class="metric-value-number highlight">101.44ms</span>
            </div>
        </div>
        <div class="metric-cell">
            <div class="metric-header">FLIP</div>
            <div class="metric-value">
                <span class="metric-value-label">Mean:</span>
                <span class="metric-value-number highlight">0.283</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Median:</span>
                <span class="metric-value-number">0.381</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q1:</span>
                <span class="metric-value-number">0.238</span>
            </div>
            <div class="metric-value">
                <span class="metric-value-label">Q3:</span>
                <span class="metric-value-number">0.532</span>
            </div>
        </div>
    </div>
</div>
    </div>
</div>

<script>
function switchScene(sceneName) {
    document.querySelectorAll('.scene-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.querySelectorAll('.scene-data').forEach(data => {
        data.classList.remove('active');
    });
    
    document.getElementById(sceneName + '-data').classList.add('active');
}
</script>

<h2>Analysis</h2>

<h3>Veach MIS Scene</h3>

<p><strong>Winner: BSDF + Light</strong> (FLIP Mean: 0.168)</p>

<p>The Veach scene validates our MIS implementation and shows the benefit of light sampling for small, bright emitters. BSDF-only sampling struggles with grazing angles and produces fireflies near the light sources. Adding light sampling (NEE) dramatically reduces variance with only a 2.9× time cost.</p>

<p>Environment sampling provides no benefit here—the scene has no environment lighting, resulting in identical FLIP scores to BSDF-only but wasting cycles. Split-lobe techniques show marginal quality improvements but don't justify their cost in this synthetic test case.</p>

<p><strong>Key insight</strong>: When small lights dominate, light sampling is essential. Environment sampling overhead is pure waste without skylight contribution.</p>

<h3>Sponza</h3>

<p><strong>Winner: Split + Light + Env</strong> (FLIP Mean: 0.492)</p>

<p>Sponza's indirect lighting from the sky dome benefits strongly from environment sampling. BSDF + Env achieves a 0.592 FLIP mean—a 7.5% improvement over BSDF-only at 77% higher cost. Combining all techniques (BSDF + Light + Env) reaches 0.590, nearly matching Env-only with added light sampling benefits.</p>

<p>The split-lobe variant wins overall (0.492), reducing error by 16% versus unified sampling with all techniques. This suggests split-lobe sampling effectively separates diffuse and specular contributions when both matter—diffuse for indirect bounce, specular for direct sun reflections.</p>

<p><strong>Key insight</strong>: Architectural interiors with dominant skylight benefit from environment sampling. Split-lobe helps when materials exhibit strong lobe separation.</p>

<h3>Bistro Exterior</h3>

<p><strong>Winner: Split + Env</strong> (FLIP Mean: 0.430)</p>

<p>The outdoor scene shows environment sampling's clear advantage—BSDF + Env achieves 0.466 (5.3% improvement) over BSDF-only. Light sampling provides minimal benefit since the sun is effectively an environment source at infinity.</p>

<p>Split-lobe techniques consistently outperform unified BSDF across all sampling combinations. Split + Env (0.430) beats BSDF + Light + Env (0.464), showing that splitting the BSDF provides more value than adding light sampling in this scenario.</p>

<p><strong>Key insight</strong>: For outdoor scenes with strong environment lighting, prioritize environment sampling over light sampling. Split-lobe sampling justifies its cost for metallic/rough material combinations common in urban environments.</p>

<h3>Bistro Interior</h3>

<p><strong>Winner: BSDF + Env</strong> (FLIP Mean: 0.269)</p>

<p>Counter-intuitively, environment sampling slightly outperforms light sampling (0.269 vs 0.294) despite multiple small interior lights. The environment map captures indirect lighting that bounces through the scene, while light sampling only handles direct illumination.</p>

<p>BSDF-only and BSDF + Light + Env tie at 0.267, but the latter costs 4.9% more time. This suggests diminishing returns—adding environment sampling to already-good light sampling provides minimal benefit.</p>

<p>Split-lobe variants don't improve results here, indicating the materials lack strong lobe separation or the scene's lighting doesn't stress the distinction.</p>

<p><strong>Key insight</strong>: In complex indoor scenes, environment sampling can capture indirect lighting that light sampling misses. More techniques ≠ better results.</p>

<h2>Cross-Scene Insights</h2>

<h3>Most Effective Single Addition</h3>

<p><strong>Environment sampling</strong> provides the broadest benefit across scenes:</p>
<ul>
<li>Veach: No benefit (0% change)</li>
<li>Sponza: 7.5% improvement</li>
<li>Bistro Exterior: 5.3% improvement</li>
<li>Bistro Interior: 0.7% improvement</li>
</ul>

<p>Light sampling is more specialized—critical for Veach (12% improvement) but marginal elsewhere.</p>

<h3>When Does Split-Lobe Help?</h3>

<p>Split-lobe sampling shows value in two scenarios:</p>
<ul>
<li><strong>Sponza</strong>: 16% improvement with all techniques—strong diffuse/specular separation matters for indirect + direct lighting</li>
<li><strong>Bistro Exterior</strong>: Consistent 5-10% improvements—rough metals benefit from separated sampling</li>
</ul>

<p>It provides no benefit in Veach (synthetic test) or Bistro Interior (materials lack lobe separation).</p>

<h3>Cost vs Benefit Tradeoffs</h3>

<p><strong>Best cost-to-quality ratios:</strong></p>
<ul>
<li><strong>BSDF + Light</strong>: Essential for small lights, reasonable 2-3× overhead</li>
<li><strong>BSDF + Env</strong>: Adds 20-40% time for 5-7% quality gains in outdoor/skylit scenes</li>
<li><strong>Split-lobe</strong>: Only justified when materials have strong lobe separation <em>and</em> lighting stresses both lobes</li>
</ul>

<p><strong>Poor value:</strong></p>
<ul>
<li><strong>BSDF + Light + Env</strong>: Combines overhead of both but rarely beats best single-technique addition</li>
<li><strong>Split + Light + Env</strong>: Maximum complexity (4 strategies) provides marginal gains over simpler combinations</li>
</ul>

<h3>The Overhead Trap</h3>

<p>Veach results reveal the overhead problem: BSDF + Light + Env (5.22ms) takes 97% more time than BSDF-only (2.63ms) for identical FLIP scores (0.168 vs 0.150). The unused environment sampling just wastes cycles.</p>

<p>This illustrates the critical principle: <strong>adaptively choosing techniques per scene beats using all techniques everywhere</strong>.</p>

<h1>Practical Recommendations</h1>

<p>Based on results:</p>

<p><strong>Default strategy</strong>: <strong>BSDF + Light</strong></p>
<ul>
<li>Works well for most indoor scenes</li>
<li>Handles small emitters efficiently</li>
<li>Reasonable 2-3× overhead</li>
</ul>

<p><strong>When to add environment sampling</strong>:</p>
<ul>
<li>Outdoor scenes with strong directional lighting (sun/sky)</li>
<li>Architectural interiors with dominant skylight</li>
<li>Adds 20-40% time for 5-7% quality improvement</li>
<li>Skip if scene has no significant environment contribution</li>
</ul>

<p><strong>Is split-lobe worth it?</strong></p>

<p>At <strong>equal SPP</strong> (our test scenario):</p>
<ul>
<li>Yes for materials with strong lobe separation (rough metals, coated surfaces)</li>
<li>Yes when both diffuse and specular contributions matter significantly</li>
<li>Expect 5-15% FLIP improvement in favorable conditions</li>
<li>No benefit for synthetic test cases or materials lacking lobe separation</li>
</ul>

<p>At <strong>equal cost</strong> (not tested):</p>
<ul>
<li>Likely only justified for hero-asset rendering where every percent matters</li>
<li>Production rendering should prefer unified BSDF + additional techniques</li>
</ul>

<p><strong>Sample budget allocation</strong>:</p>

<p>For a fixed time budget:</p>
<ol>
<li>Start with BSDF + Light (universal baseline)</li>
<li>Add environment sampling if scene has visible skylight/environment</li>
<li>Consider split-lobe only for materials known to have extreme lobe separation</li>
<li>Never use all techniques blindly—scene-adaptive selection is critical</li>
</ol>

<h1>Limitations</h1>

<p>This comparison does not cover:</p>
<ul>
<li>Volumetric scattering (where equiangular sampling matters)</li>
<li>Caustics (where light tracing/photon mapping excel)</li>
<li>Manifold exploration for SDS paths</li>
<li>Adaptive sampling strategies</li>
<li>ReSTIR or other biased techniques</li>
</ul>

<p>Results are specific to:</p>
<ul>
<li>Unidirectional path tracing</li>
<li>GPU rendering (overhead ratios differ on CPU)</li>
<li>These four scene types</li>
<li>Equal SPP testing (equal cost would show different tradeoffs)</li>
</ul>

<h1>Conclusion</h1>

<p>The key finding: <strong>scene-adaptive technique selection beats using all techniques everywhere</strong>. Environment sampling adds 20-40% overhead—valuable for outdoor/skylit scenes, wasteful for Veach. Split-lobe sampling helps rough metals but provides no benefit in simpler material scenarios.</p>

<p>For production rendering, start with BSDF + Light as your baseline. Add environment sampling when skylight is visible and significant. Reserve split-lobe sampling for materials where you've validated it provides measurable benefit—don't enable it globally hoping for improvement.</p>

<p>The goal isn't maximum technique count but rather <strong>intelligent technique selection based on scene characteristics</strong>. More sampling strategies ≠ better, especially at low sample counts where overhead dominates. Understanding when each technique helps—and when it's waste—is the real value of MIS.</p>

<h1>References</h1>

<ul>
<li>Veach & Guibas (1995) - "Optimally Combining Sampling Techniques for Monte Carlo Rendering"</li>
<li>Walter et al. (2007) - "Microfacet Models for Refraction through Rough Surfaces"</li>
<li>Andersson et al. (2020) - "FLIP: A Difference Evaluator for Alternating Images"</li>
</ul>`,
    tags: ['Graphics', 'MIS']
};