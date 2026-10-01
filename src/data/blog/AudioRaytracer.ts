export default {
    title: 'How an Audio Ray Tracer Works',
    slug: 'how-an-audio-ray-tracer-works',
    date: '2026-09-30',
    excerpt: 'The systems and formulas behind simulating sound in a game level: acoustic materials, transmission through walls, ray tracing per frequency band, echograms, reverberation time and a feedback delay network. A work in progress that grows with my audio ray tracer.',
    content: `
<style>
.rta-post.rta-post > :is(p, ul, ol, h1, h2, h3, pre, .rta-note, .rta-pitfall, .rta-wip, .rta-toc, .rta-table-wrap) { max-width: 46rem; }
.rta-post.rta-post h1, .rta-post.rta-post h2 { scroll-margin-top: 6rem; }
.rta-post.rta-post li { line-height: 1.7; padding: 0.15em 0; }
.rta-post.rta-post ul { margin: 0.5em 0 1.1rem; }
.rta-post.rta-post pre { margin: 1.5rem 0; }
.rta-wip, .rta-note, .rta-pitfall { padding: 0.9rem 1.15rem; border-radius: 6px; margin: 1.5rem 0; }
.rta-wip { background: #15120c; border: 1px solid #3a2f1c; border-left: 3px solid #e8a33d; color: #cfc6b8; margin-top: 0; }
.rta-note { background: #0f141b; border: 1px solid #1d2a3a; border-left: 3px solid #5ca3ff; }
.rta-pitfall { background: #15120c; border: 1px solid #3a2f1c; border-left: 3px solid #e8a33d; }
.rta-wip p, .rta-note p, .rta-pitfall p { margin: 0; }
.rta-badge { display: inline-block; font-size: 0.72rem; font-weight: 500; line-height: 1; padding: 0.32em 0.62em; border-radius: 999px; border: 1px solid; vertical-align: 0.3em; margin-left: 0.55rem; white-space: nowrap; }
.rta-wip .rta-badge, .rta-table .rta-badge { margin-left: 0; vertical-align: 0.05em; }
.rta-ok { color: #7fd1a0; border-color: #25503a; background: #0e1912; }
.rta-prog { color: #eab45e; border-color: #4d3c1c; background: #17120a; }
.rta-plan { color: #a3a3a3; border-color: #333; background: #141414; }
.rta-fig { margin: 2rem 0 2.25rem; }
.rta-fig .rta-scroll { overflow-x: auto; border: 1px solid #1c1c1c; border-radius: 8px; }
.rta-fig img { display: block; width: 100%; min-width: 620px; height: auto; }
.rta-fig figcaption { color: #8a8a8a; font-size: 0.9rem; line-height: 1.6; margin-top: 0.7rem; max-width: 46rem; }
.rta-table-wrap { overflow-x: auto; margin: 1.25rem 0 1.75rem; }
.rta-table { border-collapse: collapse; width: 100%; font-size: 0.93rem; line-height: 1.5; }
.rta-table th, .rta-table td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #222; vertical-align: top; }
.rta-table th { color: #fff; font-weight: 600; border-bottom-color: #333; }
.rta-table .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rta-toc { border: 1px solid #1f1f1f; border-radius: 8px; padding: 1rem 1.25rem 0.75rem; margin: 1.75rem 0 0.5rem; background: #0e0e0e; }
.rta-toc p { margin: 0; color: #fff; font-weight: 600; }
.rta-post.rta-post .rta-toc ol { columns: 2; column-gap: 2.5rem; margin: 0.5rem 0 0; padding-left: 1.4rem; }
.rta-post.rta-post .rta-toc li { line-height: 1.5; padding: 0.2em 0; break-inside: avoid; }
@media (max-width: 640px) { .rta-post.rta-post .rta-toc ol { columns: 1; } }
</style>

<div class="rta-post">

<div class="rta-wip"><p><strong>Work in progress.</strong> I'm writing this alongside my audio ray tracer, so it grows with the project. Each part of the system is marked <span class="rta-badge rta-ok">Working</span>, <span class="rta-badge rta-prog">In progress</span> or <span class="rta-badge rta-plan">Planned</span>. Last updated 30 September 2026.</p></div>
<!-- TODO: update "Last updated" and the badges every time a part changes status. -->

<h1 id="intro">Introduction</h1>

<p>Games simulate light in more and more detail, while sound propagation is still mostly authored by hand. The usual engine setup is a single line trace between listener and source, a lowpass filter when that line is blocked, and reverb volumes that someone places and tunes room by room. That works until the geometry changes. Open a door, blow a hole in a wall or add a room, and the audio doesn't know.</p>

<p>An audio ray tracer asks the level instead. It traces rays through the actual geometry, looks up what every surface is made of, and derives occlusion, transmission through walls and the reverb of the room from the result. This post walks through the systems and formulas that make that work, in the order the data flows through them. I'm building mine as an Unreal Engine plugin, but nothing here depends on the engine: any engine that can cast rays can do all of it.</p>

<p>If you know graphics path tracing, a lot will feel familiar. Cosine-weighted sampling, next-event estimation and Russian roulette all carry over (I compared the lighting versions in my <a href="/blog/comparing-mis-strategies">post on MIS strategies</a>). What changes is what a ray carries, and what you do with the result.</p>

<h2>Sound is not light</h2>

<p>Three differences shape everything that follows.</p>
<ul>
<li><strong>Sound is slow.</strong> At 343 m/s, the echo from a wall 10 m away arrives almost 60 ms after you clap. Light transport can ignore time; sound can't, because <em>when</em> the energy arrives is the reverb. So the tracer keeps a histogram over time instead of a single sum.</li>
<li><strong>Wavelengths are huge.</strong> From 2.7 m at 125 Hz down to 8.6 cm at 4 kHz, sound waves are the size of the things they hit. A ray is only a good model when a surface is large compared to the wavelength, so rays work best at high frequencies and worst at low ones, where sound bends around obstacles (diffraction) and rooms ring at their resonant modes.</li>
<li><strong>Rays carry energy, not waves.</strong> A ray stores energy per frequency band and no phase. That makes the simulation cheap and stable, and it means interference effects such as room modes and comb filtering aren't simulated at all. This family of methods is called geometric acoustics.</li>
</ul>

<nav class="rta-toc" aria-label="Contents">
<p>In this post</p>
<ol>
<li><a href="#pipeline">The pipeline</a></li>
<li><a href="#bands">Frequency bands</a></li>
<li><a href="#materials">Acoustic materials</a></li>
<li><a href="#transmission">Transmission through walls</a></li>
<li><a href="#distance">Distance and air</a></li>
<li><a href="#energy">Energy in, amplitude out</a></li>
<li><a href="#tracing">Tracing rays</a></li>
<li><a href="#occlusion">Occlusion per source</a></li>
<li><a href="#echogram">The echogram</a></li>
<li><a href="#decay">Reverberation time</a></li>
<li><a href="#reverb">A feedback delay network</a></li>
<li><a href="#threads">Keeping the audio thread fed</a></li>
<li><a href="#status">Where it stands</a></li>
<li><a href="#references">References</a></li>
</ol>
</nav>

<h1 id="pipeline">The pipeline</h1>

<figure class="rta-fig" style="max-width: 960px;">
<div class="rta-scroll"><img src="/media/blog/AudioRaytracer/pipeline.svg" alt="Data flow: acoustic materials feed a ray tracer running on a background thread. One branch runs per source (direct path and next-event estimation, occlusion, voice filter); the other runs per listener (echogram, decay analysis, FDN reverb)." loading="lazy"></div>
<figcaption>Materials are baked once. The tracer runs on a background thread and feeds two consumers at different rates.</figcaption>
</figure>

<p>Everything starts with acoustic materials, baked once per asset. The ray tracer feeds two consumers. Per source, it estimates how much energy gets from that source to the listener in each frequency band, and that becomes a filter on the voice. Per listener, a separate room probe records <em>when</em> energy returns to the listener, which becomes an echogram, then a reverberation time, then the settings of a reverb.</p>

<p>The split is deliberate. How blocked a sound is depends on where its source is, so that has to be computed per source. How long a room rings doesn't depend on what's making the noise, so one probe per listener is enough. Tracing reverb-length paths for every source instead would cost roughly ten times as many line traces.</p>

<h1 id="bands">Frequency bands</h1>

<p>Every quantity in the simulation is stored per frequency band. I use the six standard octave bands from 125 Hz to 4 kHz, because that's the resolution in which measured material data is published, and absorption varies a lot across them. That variation is most of what makes carpet sound different from concrete.</p>

<div class="rta-table-wrap"><table class="rta-table">
<thead><tr><th>Band</th><th class="num">125 Hz</th><th class="num">250 Hz</th><th class="num">500 Hz</th><th class="num">1 kHz</th><th class="num">2 kHz</th><th class="num">4 kHz</th></tr></thead>
<tbody><tr><td>Wavelength</td><td class="num">2.74 m</td><td class="num">1.37 m</td><td class="num">69 cm</td><td class="num">34 cm</td><td class="num">17 cm</td><td class="num">8.6 cm</td></tr></tbody>
</table></div>

<p>Six is a simulation choice, not a DSP one. Another band costs the tracer one more float per ray, while the audio side pays per sample for every filter band, so the voice filter folds the six bands into three (more on that below).</p>

<h1 id="materials">Acoustic materials <span class="rta-badge rta-ok">Working</span></h1>

<p>When a ray hits a surface, the incident energy splits three ways. Some is absorbed (turned into heat), some is transmitted to the other side, and the rest is reflected. Per band $b$:</p>

<p>$$\\alpha_b + \\tau_b + \\rho_b = 1 \\quad\\Longrightarrow\\quad \\rho_b = 1 - \\alpha_b - \\tau_b$$</p>

<p>A material asset stores three things:</p>
<ul>
<li><strong>The absorption coefficient $\\alpha_b$</strong>, taken from published tables measured in a reverberation room (ISO 354). Because it's measured rather than modelled, the asset treats it as ground truth.</li>
<li><strong>The transmission coefficient $\\tau_b$</strong>, computed from physical properties: density, thickness and stiffness (next section).</li>
<li><strong>The scattering coefficient $s$</strong>: the fraction of reflected energy that leaves in a random, diffuse direction instead of the mirror direction (ISO 17497-1).</li>
</ul>

<div class="rta-table-wrap"><table class="rta-table">
<thead><tr><th>Absorption $\\alpha_b$</th><th class="num">125</th><th class="num">250</th><th class="num">500</th><th class="num">1k</th><th class="num">2k</th><th class="num">4k</th></tr></thead>
<tbody>
<tr><td>Drywall on studs</td><td class="num">0.29</td><td class="num">0.10</td><td class="num">0.05</td><td class="num">0.04</td><td class="num">0.07</td><td class="num">0.09</td></tr>
<tr><td>Solid wood door</td><td class="num">0.14</td><td class="num">0.10</td><td class="num">0.06</td><td class="num">0.08</td><td class="num">0.10</td><td class="num">0.10</td></tr>
<tr><td>Carpet on concrete</td><td class="num">0.02</td><td class="num">0.04</td><td class="num">0.08</td><td class="num">0.20</td><td class="num">0.35</td><td class="num">0.50</td></tr>
</tbody>
</table></div>

<p>The table shows the materials in my test scene. Drywall absorbs mostly at 125 Hz, where the board and the cavity behind it resonate; carpet does the opposite and eats high frequencies. Two details matter more than they look.</p>

<p>First, the budget has to hold in every band. If $\\alpha_b + \\tau_b$ exceeds 1, the surface creates energy, so each asset checks this when it's baked, keeps the measured $\\alpha_b$ and clamps the modelled $\\tau_b$. Second, a measured absorption coefficient counts everything that isn't reflected back, and for a lightweight panel part of that is energy the panel passes to the other side, which is exactly what $\\tau_b$ counts too. For heavy walls the overlap is negligible. For thin panels, $\\rho_b = 1 - \\alpha_b - \\tau_b$ counts some of the same energy twice.</p>

<p>Scattering is the property I trust least. It depends on surface relief compared to the wavelength, not on what the surface is made of: a surface behaves as smooth when its bumps are smaller than about an eighth of a wavelength. The same oak can be a flat wall or a panelled door, and those scatter very differently. One scattering value per material, as I store it now, is a simplification.</p>

<h1 id="transmission">Transmission through walls <span class="rta-badge rta-ok">Working</span></h1>

<p>Transmission is usually quoted as a transmission loss (TL) in decibels, while the simulation needs the energy ratio:</p>

<p>$$\\tau = 10^{-\\mathrm{TL}/10}$$</p>

<p>A 30 dB wall passes a thousandth of the energy. The interesting part is predicting TL from the physical properties of a wall.</p>

<h2>The mass law</h2>

<p>At low frequencies a wall behaves like a heavy, limp sheet. Sound pushes it back and forth, and the heavier it is, the less it moves. For sound arriving from all directions (the field-incidence mass law):</p>

<p>$$\\mathrm{TL} \\approx 20\\log_{10}(m f) - 47\\ \\text{dB}$$</p>

<p>with $m$ the surface mass in kg/m² (density times thickness) and $f$ the frequency in Hz. Doubling the mass or the frequency buys 6 dB.</p>

<h2>Coincidence</h2>

<p>Real walls are stiff plates, and plates carry bending waves whose speed rises with frequency. At the <strong>critical frequency</strong> the bending waves travel exactly as fast as sound grazing along the surface, the two couple, and the wall suddenly becomes much easier to get through:</p>

<p>$$f_c = \\frac{c^2}{2\\pi}\\sqrt{\\frac{m}{B}}, \\qquad B = \\frac{E\\,h^3}{12\\,(1-\\nu^2)}$$</p>

<p>Here $B$ is the bending stiffness of a thin plate with Young's modulus $E$ (not energy, for once), thickness $h$ and Poisson's ratio $\\nu$. Around $f_c$ the transmission loss dips well below the mass law. Above it, the loss factor $\\eta$ (the panel's internal damping, which depends heavily on how it's mounted) sets how quickly it recovers.</p>

<h2>Sharp's model</h2>

<p>Sharp's prediction method (1978) stitches these regions into one curve. With $\\mathrm{TL}_A$ the value of the first line at $f_c/2$ and $\\mathrm{TL}_B$ the value of the third line at $f_c$:</p>

<p>$$\\mathrm{TL}(f) = \\begin{cases} 20\\log_{10}(m f) - 47 &amp; f \\lt f_c/2 \\\\[6pt] \\mathrm{TL}_A + (\\mathrm{TL}_B - \\mathrm{TL}_A)\\,\\log_2\\dfrac{2f}{f_c} &amp; f_c/2 \\le f \\lt f_c \\\\[6pt] 20\\log_{10}\\dfrac{\\pi m f}{\\rho_0 c} + 10\\log_{10}\\dfrac{2\\eta f}{\\pi f_c} &amp; f \\ge f_c \\end{cases}$$</p>

<p>Two details are easy to get wrong, and I got both wrong at first. The middle region is a straight line on a logarithmic frequency axis between its two neighbours, so the curve is continuous by construction. And above $f_c$ the curve is built on the <em>normal</em>-incidence mass law, $20\\log_{10}(\\pi m f / \\rho_0 c) \\approx 20\\log_{10}(m f) - 42$ with $\\rho_0 c \\approx 415$ for air, not on the field-incidence one. That's a 5 dB difference.</p>

<figure class="rta-fig" style="max-width: 832px;">
<div class="rta-scroll"><img src="/media/blog/AudioRaytracer/sharp-tl.svg" alt="Transmission loss against frequency for a 44 mm solid wood door: the mass law, Sharp's continuous curve with its coincidence dip at 358 Hz, and a first implementation with a 34 dB step at the critical frequency." loading="lazy"></div>
<figcaption>Sharp's model for a 44 mm solid wood door (650 kg/m³, E = 10 GPa, ν = 0.3, η = 0.01), which puts $f_c$ at about 358 Hz. The dots are the six simulation bands. The dashed amber line is my first implementation, with a wrong middle branch and the wrong constant above $f_c$.</figcaption>
</figure>

<div class="rta-pitfall"><p><strong>Pitfall.</strong> A piecewise model can be continuous on paper and discontinuous in code. Before trusting one, evaluate it just below and just above every breakpoint. My first version of this door jumped 34 dB at $f_c$ and put the 250 Hz band at 36 dB instead of 22 dB. A plot like the one above would have shown it in minutes.</p></div>

<h2>Double walls</h2>

<p>Most interior walls are two leaves with a cavity between them. The air in the cavity acts as a spring, which gives a mass-air-mass resonance:</p>

<p>$$f_0 = \\frac{1}{2\\pi}\\sqrt{\\frac{\\rho_0 c^2\\,(m_1 + m_2)}{d_{\\text{cav}}\\,m_1 m_2}}$$</p>

<p>Below $f_0$ the two leaves move together and the wall follows the mass law for its total mass. Above it they decouple, and transmission loss climbs at about 18 dB per octave until the cavity depth becomes comparable to the wavelength, where the slope drops to about 12 dB per octave. Studs and ties bridge the two leaves and cap the improvement.</p>

<h2>Where the model stops working</h2>

<p>Sharp's model assumes a large, thin, homogeneous panel with sound arriving from all directions at once. A ray tracer applies it per ray, at whatever angle the ray happens to hit, and to every material. That stretches it:</p>
<ul>
<li><strong>Porous materials</strong> such as curtains, carpet or foliage transmit according to how easily air flows through them, not according to their mass.</li>
<li><strong>Small objects</strong>, around a wavelength or smaller, don't block sound at all; it bends around them.</li>
<li><strong>Gaps</strong> dominate everything. An opening of 1% of the area caps a wall at about 20 dB however heavy it is, and doors, windows and vents are full of gaps.</li>
<li><strong>Very light panels at low frequencies</strong> push the formula below 0 dB, which means nothing physically. Clamp TL at 0 dB: the panel passes everything.</li>
</ul>

<p>There's a game-specific catch as well. A wall mesh is often a single-sided plane, so its thickness is a number someone typed into an asset. A more accurate model would mostly be more accurate about a guess, which is why I haven't moved to something heavier like the transfer matrix method.</p>

<h1 id="distance">Distance and air <span class="rta-badge rta-ok">Working</span></h1>

<p>Two things weaken sound over distance. The first is spreading. A point source spreads its power $W$ over a sphere, so intensity falls with the square of the distance, 6 dB per doubling:</p>

<p>$$I(d) = \\frac{W}{4\\pi d^2}$$</p>

<p>The second is air absorption, which turns sound into heat along the way. It's exponential in distance and strongly frequency dependent:</p>

<p>$$E(d) = E_0\\,e^{-m_b d}, \\qquad m_b = \\frac{\\ln 10}{10}\\cdot\\frac{a_b}{1000}$$</p>

<p>Standards publish the attenuation $a_b$ in dB per km. The second formula converts it to the energy coefficient $m_b$ per metre that the tracer uses. These are the values from ISO 9613-1 for 20 °C and 70% relative humidity:</p>

<div class="rta-table-wrap"><table class="rta-table">
<thead><tr><th>Band</th><th class="num">125</th><th class="num">250</th><th class="num">500</th><th class="num">1k</th><th class="num">2k</th><th class="num">4k</th></tr></thead>
<tbody>
<tr><td>$a_b$ (dB/km)</td><td class="num">0.3</td><td class="num">1.1</td><td class="num">2.8</td><td class="num">5.0</td><td class="num">9.0</td><td class="num">22.9</td></tr>
<tr><td>$m_b$ (1/m)</td><td class="num">0.00007</td><td class="num">0.00025</td><td class="num">0.00065</td><td class="num">0.00115</td><td class="num">0.00207</td><td class="num">0.00527</td></tr>
</tbody>
</table></div>

<p>Inside a building that's small for a single path, but it adds up in a reverb tail, where energy travels hundreds of metres. At 4 kHz it costs about 2.3 dB per 100 m. That's a large part of why real rooms decay faster at high frequencies, and why distant sounds are dull rather than just quiet. Humidity matters too: at 50% the 4 kHz value would be about 30 dB/km instead of 23.</p>

<div class="rta-pitfall"><p><strong>Pitfall.</strong> Nepers come in an energy and an amplitude flavour. Converting dB/km with $\\ln 10/20$ (amplitude) instead of $\\ln 10/10$ (energy) halves the air absorption. And apply it exactly once per metre travelled: either along each segment or all at once when energy is deposited, never both.</p></div>

<p>In my plugin the room probe uses these coefficients directly. The direct path still uses a simpler distance-to-cutoff lowpass, which is much stronger than real air over the same distance; replacing it with these coefficients is on the list.</p>
<!-- TODO: once the direct path uses m_b, delete the paragraph above. -->

<h1 id="energy">Energy in, amplitude out</h1>

<p>Everything in the simulation is energy: absorption, transmission and air absorption are all energy ratios. Audio samples are pressure, and energy goes with pressure squared. So the moment a simulated number becomes a gain on a signal, it needs a square root:</p>

<p>$$g = \\sqrt{\\frac{E_{\\text{out}}}{E_{\\text{in}}}} \\quad\\Longleftrightarrow\\quad 20\\log_{10} g = 10\\log_{10}\\frac{E_{\\text{out}}}{E_{\\text{in}}}$$</p>

<div class="rta-pitfall"><p><strong>Pitfall.</strong> Apply an energy ratio directly as an amplitude gain and every attenuation comes out twice as strong in decibels. My occlusion did exactly that for as long as the code existed. I now convert in one single place, where the simulation hands over to the audio, so it can't happen twice or not at all.</p></div>

<h1 id="tracing">Tracing rays</h1>

<p>Both consumers run the same bounce loop. They only differ in what they collect along the way.</p>

<h2>Start at the listener</h2>

<p>A game has one listener and many sources, so rays start at the listener. Energy transport is reciprocal: the path from A to B loses the same energy as the path from B to A. Tracing backwards gives the same answer and lets one set of rays serve every source.</p>

<h2>Bouncing</h2>

<p>At every hit the ray loses energy in each band and picks a new direction. With $\\Delta d$ the length of the segment it just travelled:</p>

<p>$$E_b \\leftarrow E_b\\,\\rho_b\\,e^{-m_b\\,\\Delta d}$$</p>

<p>The scattering coefficient chooses the new direction. With probability $s$ the reflection is diffuse, otherwise it's a mirror reflection. Diffuse directions are sampled from a cosine-weighted hemisphere, Lambert's law, exactly like a diffuse surface in a path tracer:</p>

<p>$$\\mathbf{d}_{\\text{spec}} = \\mathbf{d} - 2(\\mathbf{d}\\cdot\\mathbf{n})\\,\\mathbf{n}, \\qquad \\mathbf{d}_{\\text{diff}} = \\big(\\sqrt{u_1}\\cos 2\\pi u_2,\\ \\sqrt{u_1}\\sin 2\\pi u_2,\\ \\sqrt{1-u_1}\\big)$$</p>

<p>Here $u_1, u_2$ are uniform random numbers and the diffuse direction is expressed in a frame around the normal $\\mathbf{n}$. Picking one lobe at random instead of splitting the ray in two keeps the ray count constant, and on average it's the same thing.</p>

<h2>Stopping</h2>

<p>A ray could bounce forever, so it has to be stopped somehow. Cutting every ray off at a fixed depth is the obvious choice, and it's wrong: it silently deletes the end of the decay, which is exactly the part the reverb needs. Russian roulette stops rays without that bias. After a minimum depth, a ray survives with probability $q$, and a survivor's energy is divided by $q$ to make up for the rays that were killed:</p>

<p>$$E_b' = \\begin{cases} E_b / q &amp; \\text{with probability } q \\\\ 0 &amp; \\text{with probability } 1 - q \\end{cases} \\qquad \\mathbb{E}[E_b'] = q \\cdot \\frac{E_b}{q} = E_b$$</p>

<p>I start roulette at depth 10 with $q = \\operatorname{clamp}(\\max_b E_b,\\ 0.05,\\ 0.95)$. Rays with little energy left will probably die, and the ones that survive come back at full strength. The result is right on average; the price is noise, which the echogram averages away over time.</p>

<div class="rta-pitfall"><p><strong>Pitfall.</strong> A maximum depth is still a truncation, even with roulette. The expected energy left after $n$ bounces is about $(1-\\bar\\alpha)^n$, so a cap of 64 bounces in a room with $\\bar\\alpha = 0.08$ cuts off everything below $10\\log_{10}(0.92^{64}) \\approx -23$ dB. That's inside the range you fit reverberation times on. With roulette in place the cap is only a safety net and can be generous, since very few rays ever get near it.</p></div>
<!-- TODO: once the probe's depth cap is raised, say so here ("my probe used 64 until I noticed"). -->

<h2>The whole loop</h2>

<pre><code>for each ray leaving the listener:
    E[b] = 1 for every band
    for depth = 0 .. maxDepth:
        hit = trace(origin, dir)              // nothing hit: energy left the level
        E[b] *= exp(-m[b] * hit.distance)     // air along this segment
        deposit(hit, E)                       // per-source NEE or room-probe rain
        E[b] *= rho[b]                        // absorption and transmission
        dir = rand() &lt; s ? cosineSample(hit.normal) : reflect(dir, hit.normal)
        origin = hit.point
        if depth &gt;= 10 and not roulette(E):   // survive with q, E /= q
            break</code></pre>

<p>The next two sections are the two versions of <code>deposit</code>.</p>

<h1 id="occlusion">Occlusion per source <span class="rta-badge rta-ok">Working</span></h1>

<p>For every source, about 30 times a second, the tracer answers one question per band: how much of the source's energy reaches the listener, compared with an unobstructed path?</p>

<h2>The direct path</h2>

<p>First a straight line from listener to source. If it's clear, the direct transmission is 1 in every band. If it crosses walls, their transmission coefficients multiply, so their losses in decibels add:</p>

<p>$$D_b = \\prod_{i\\,\\in\\,\\text{walls}} \\tau_{i,b}$$</p>

<p>This ignores flanking, sound that goes around a wall through the building's structure, which in real buildings often decides what you actually hear from next door.</p>

<h2>Paths around the obstacle</h2>

<p>A sound behind a pillar isn't silent: it reaches you around the pillar, via reflections. To find those paths, rays leave the listener and bounce through the scene, and at every bounce the tracer casts a shadow ray straight at the source. This is next-event estimation, the same trick a path tracer uses for small lights. Instead of hoping a random bounce happens to hit a small target, you test the direct connection at every step.</p>

<p>For occlusion only the first connection of each ray counts. If ray $j$ first sees the source with energy $E_{j,b}$ after a total distance $d_j$, including the shadow ray, it contributes $C_{j,b} = E_{j,b}\\,e^{-m_b d_j}$. A ray that never sees the source contributes 0. Averaged over $N$ rays and combined with the direct path:</p>

<p>$$I_b = \\frac{1}{N}\\sum_{j=1}^{N} C_{j,b}, \\qquad F_b = D_b + (1 - D_b)\\,I_b$$</p>

<p>To be honest about what this is: a heuristic, not an energy simulation. The second formula is a probabilistic OR ("through, or else around"), and "the energy of the first connection" isn't a physical quantity. It produces believable, frequency-dependent occlusion, which is its job, but you can't build a reverb on it. That's why the reverb has its own trace.</p>

<h2>Into the audio</h2>

<p>The six band values become a three-band filter on the voice. Neighbouring bands are averaged in energy, and only then converted to amplitude:</p>

<p>$$\\begin{aligned} g_{\\text{low}} &amp;= \\sqrt{\\tfrac{1}{2}(F_{125} + F_{250})} \\\\ g_{\\text{mid}} &amp;= \\sqrt{\\tfrac{1}{2}(F_{500} + F_{1\\text{k}})} \\\\ g_{\\text{high}} &amp;= \\sqrt{\\tfrac{1}{2}(F_{2\\text{k}} + F_{4\\text{k}})} \\end{aligned}$$</p>

<p>The crossovers sit at the geometric means between those pairs, $\\sqrt{250 \\cdot 500} \\approx 354$ Hz and $\\sqrt{1000 \\cdot 2000} \\approx 1414$ Hz. The split uses one-pole lowpass filters and subtraction:</p>

<p>$$y[n] = y[n-1] + \\beta\\,\\big(x[n] - y[n-1]\\big), \\qquad \\beta = 1 - e^{-2\\pi f_{\\text{cut}}/f_s}$$</p>

<p>$$\\begin{aligned} \\text{low} &amp;= \\mathrm{LP}_{354}(x) \\\\ \\text{high} &amp;= x - \\mathrm{LP}_{1414}(x) \\\\ \\text{mid} &amp;= x - \\text{low} - \\text{high} \\end{aligned}$$</p>

<p>By construction the three bands add back up to the input exactly, so with all gains at 1 the filter is perfectly transparent. The trade-off is soft band edges: a one-pole filter rolls off at only 6 dB per octave, so a heavily attenuated band still leaks into its neighbours. The gains ramp across each audio buffer so they never jump. And until the first trace result arrives, a voice plays unfiltered: a sound that's briefly too loud is a better failure than a sound that's missing.</p>

<h1 id="echogram">The echogram <span class="rta-badge rta-ok">Working</span></h1>

<p>Reverb needs different information: not how much energy arrives, but when. The room probe collects it in an echogram, a histogram of arriving energy over time for each band. Mine has 1 ms bins and 3 s of history, which is 6 × 3000 floats or 72 KB. A contribution with total path length $d$ lands in bin</p>

<p>$$k = \\left\\lfloor \\frac{d}{c\\,\\Delta t} \\right\\rfloor, \\qquad c = 343\\ \\text{m/s}, \\quad \\Delta t = 1\\ \\text{ms}$$</p>

<p>About a thousand rays leave the listener four times a second, and the energy is collected back at the listener. The probe answers the question "how does this room respond to a sound made where I'm standing?"</p>

<h2>Diffuse rain</h2>

<p>A random ray almost never hits a small receiver, so waiting for hits would take millions of rays. Instead, every bounce that can see the listener sends a share of its energy straight to it. This is known as diffuse rain.</p>

<figure class="rta-fig" style="max-width: 720px;">
<div class="rta-scroll"><img src="/media/blog/AudioRaytracer/diffuse-rain.svg" alt="A ray hits a surface at point P. A shadow ray of length R goes from P to a listener sphere of radius r, at angle theta from the surface normal. A cosine-shaped Lambert lobe sits on the surface at P." loading="lazy"></div>
<figcaption>One deposit. The shadow ray checks visibility; the Lambert lobe and the size of the listener decide how much of the reflected energy goes to the listener.</figcaption>
</figure>

<p>The share follows from two facts. A diffuse surface sends a fraction $\\cos\\theta/\\pi$ of its reflected energy into each unit of solid angle, with $\\theta$ measured from the surface normal. And a listener modelled as a sphere of radius $r$ at distance $R$ covers a solid angle of about $\\pi r^2/R^2$. Multiply the two, and rain only the diffuse part $s$ of the reflection:</p>

<p>$$\\Delta E_b = E_b\\,\\rho_b\\,s\\;\\frac{\\cos\\theta}{\\pi}\\cdot\\frac{\\pi r^2}{R^2}\\;e^{-m_b R} \\;=\\; E_b\\,\\rho_b\\,s\\,\\cos\\theta\\,\\frac{r^2}{R^2}\\,e^{-m_b R}$$</p>

<p>The deposit is an estimate, not a transfer. The ray keeps its full reflected energy and carries on bouncing, and since nothing ever counts the ray itself arriving at the listener, nothing is counted twice.</p>

<div class="rta-note"><p><strong>Where the inverse-square law lives.</strong> It's tempting to also divide every deposit by $R^2$ to account for distance. Don't: the solid-angle term $r^2/R^2$ already <em>is</em> the inverse-square law. Applying it again counts distance twice.</p></div>

<p>Three practical details:</p>
<ul>
<li><strong>The radius cancels.</strong> Divide the finished echogram by the number of rays and by $\\pi r^2$ and you get energy per unit area, which doesn't depend on the $r$ you picked.</li>
<li><strong>Clamp $R$.</strong> Next to a wall, $R$ goes to zero and $r^2/R^2$ explodes. I clamp it at 0.5 m.</li>
<li><strong>Leave out the direct sound.</strong> The dry voice already delivers it; the reverb should only add what comes after.</li>
</ul>

<p>One probe on its own is noisy, so probes are blended into a running average. The first probes are weighted equally and after that older probes fade out exponentially, so the estimate settles quickly and still follows you into the next room. Average the echogram, not the reverberation time computed from it: smoothing a number that was fitted to noisy data is worse than smoothing the data and fitting once.</p>

<p>One limitation to know about: only the diffuse part is rained. A path that reflects like a mirror all the way from the listener back to the listener never reaches the echogram until it scatters somewhere. That mostly affects the first few tens of milliseconds, so the start of the echogram is its least trustworthy part. Hybrid solvers handle early mirror reflections separately with image sources.</p>
<!-- TODO: add a real echogram from the plugin's Excel export here, e.g. /media/blog/AudioRaytracer/echogram.png -->

<h1 id="decay">Reverberation time <span class="rta-badge rta-prog">In progress</span></h1>

<h2>Schroeder integration</h2>

<p>An echogram is far too spiky to read a decay from. Schroeder's method (1965) integrates it backwards: the energy decay curve at time $t$ is all the energy that still arrives after $t$.</p>

<p>$$\\begin{aligned} \\mathrm{EDC}(t) &amp;= \\int_t^{\\infty} E(t')\\,dt' \\\\ \\mathrm{EDC}[k] &amp;= \\sum_{j \\ge k} E[j] \\\\ L(t) &amp;= 10\\log_{10}\\frac{\\mathrm{EDC}(t)}{\\mathrm{EDC}(0)} \\end{aligned}$$</p>

<p>In decibels this is a smooth curve that starts at 0 dB and only goes down. For a single exponential decay it's a straight line.</p>

<figure class="rta-fig" style="max-width: 832px;">
<div class="rta-scroll"><img src="/media/blog/AudioRaytracer/schroeder.svg" alt="Level in decibels over two seconds: a noisy echogram in grey, a smooth Schroeder curve in blue, and a straight line fitted between minus 5 and minus 35 dB and extended to minus 60 dB." loading="lazy"></div>
<figcaption>Synthetic data for illustration. The echogram (grey) is too noisy to fit; the Schroeder curve (blue) integrated from it is smooth. A line fitted between −5 and −35 dB and extended to −60 dB gives T30.</figcaption>
</figure>

<h2>EDT, T20 and T30</h2>

<p>The reverberation time $T_{60}$ is how long a sound takes to decay by 60 dB. Hardly any measurement has 60 dB of clean decay, so ISO 3382-1 fits a straight line over part of the Schroeder curve and extrapolates:</p>

<div class="rta-table-wrap"><table class="rta-table">
<thead><tr><th>Measure</th><th>Fit range</th><th>What it describes</th></tr></thead>
<tbody>
<tr><td>EDT</td><td>0 to −10 dB</td><td>The start of the decay, which is closest to how reverberant a room sounds</td></tr>
<tr><td>T20</td><td>−5 to −25 dB</td><td>The main decay</td></tr>
<tr><td>T30</td><td>−5 to −35 dB</td><td>The main decay, over more range; needs the cleanest tail</td></tr>
</tbody>
</table></div>

<p>$$T = \\frac{-60\\ \\text{dB}}{\\text{slope in dB/s}}$$</p>

<p>The three are also a diagnostic. For a single-slope decay they agree. If T30 comes out shorter than T20, the tail is being cut off: the history is too short, too few rays survive, or a depth cap is in the way. The honest response is to report the value as invalid rather than return a wrong number, so my decay code checks that the curve actually reaches −35 dB inside the window and refuses to report T30 when it doesn't.</p>

<h2>A cross-check from the rays: Eyring</h2>

<p>The tracer also yields an analytical estimate almost for free. If rays hit a surface on average every $\\bar\\ell$ metres (the mean free path) and lose a fraction $\\bar\\alpha_b$ of their energy per hit, then after time $t$ they have made $ct/\\bar\\ell$ bounces:</p>

<p>$$E_b(t) = E_0\\,(1-\\bar\\alpha_b)^{ct/\\bar\\ell}\\,e^{-m_b c t}$$</p>

<p>Setting $E_b(T_{60}) = 10^{-6}E_0$ and solving for $T_{60}$ gives Eyring's formula:</p>

<p>$$T_{60} = \\frac{6\\ln 10}{c}\\cdot\\frac{\\bar\\ell}{-\\ln(1-\\bar\\alpha_b) + m_b\\bar\\ell} \\;\\approx\\; 0.161\\,\\frac{\\bar\\ell/4}{-\\ln(1-\\bar\\alpha_b) + m_b\\bar\\ell}$$</p>

<p>For a room with volume $V$ and surface area $S$ the mean free path is $\\bar\\ell = 4V/S$, which turns this into the textbook form</p>

<p>$$T_{60} = \\frac{0.161\\,V}{-S\\ln(1-\\bar\\alpha_b) + 4m_b V}$$</p>

<p>and for small $\\bar\\alpha_b$, where $-\\ln(1-\\bar\\alpha_b) \\approx \\bar\\alpha_b$, into Sabine's formula. The nice part: the probe measures $\\bar\\ell$ and a hit-weighted $\\bar\\alpha_b$ directly from its rays, so it gets an Eyring estimate without ever knowing $V$ or $S$, which you don't have for arbitrary level geometry.</p>

<p>Eyring assumes a diffuse field, with energy spread evenly and travelling in all directions. Real rooms, and certainly game levels full of corridors and connected spaces, often aren't like that. So the traced decay is the answer and Eyring is the sanity check. If the two disagree in a simple room, something is broken; if they disagree in a complicated one, that may be the whole point of tracing.</p>

<p><strong>Next step:</strong> validating the whole chain in a shoebox room, where the answer is known. The traced mean free path should match $4V/S$ and the traced T30 should land close to Eyring. Until that passes, I treat every reverberation time the plugin reports as a measurement of the simulation, not of the room.</p>
<!-- TODO: add the shoebox result (traced MFP vs 4V/S, T30 vs Eyring per band) when it exists. -->

<h1 id="reverb">Making it audible: a feedback delay network <span class="rta-badge rta-prog">In progress</span></h1>

<p>There are two ways to turn all this into sound. Convolution plays the signal through an impulse response synthesized from the echogram. It's the most faithful, but the impulse response changes several times a second as you move, and crossfading between impulse responses without artifacts is a project in itself. A feedback delay network (FDN) is a parametric reverb: you give it a decay time per band and it produces a tail that matches, cheaply and smoothly. I'm starting with the FDN because it's easier to verify. Convolution stays an option once the physics is validated.</p>

<figure class="rta-fig" style="max-width: 760px;">
<div class="rta-scroll"><img src="/media/blog/AudioRaytracer/fdn.svg" alt="One FDN delay line: the input goes through an adder, a delay of M samples and a decay gain with damping, is tapped to the output sum, and feeds back through a feedback matrix into the adder." loading="lazy"></div>
<figcaption>One of the 16 delay lines. Every line feeds back into every other line through the matrix $A$.</figcaption>
</figure>

<p>An FDN is a set of $N$ delay lines whose outputs are mixed and fed back into their inputs. With $v_i[n]$ the output of line $i$ and $M_i$ its length in samples:</p>

<p>$$v_i[n + M_i] = x[n] + \\sum_{j=1}^{N} A_{ij}\\,g_j\\,v_j[n], \\qquad y[n] = \\frac{1}{\\sqrt{N}}\\sum_{i=1}^{N} g_i\\,v_i[n]$$</p>

<p>With every $g_i = 1$ and an orthogonal matrix $A$, one that preserves energy, the network rings forever: it's lossless. The decay then comes entirely from the gains. After $T_{60}$ seconds the signal has to be 60 dB down, a factor $10^{-3}$ in amplitude, and a signal passes through line $i$ exactly $f_s T_{60}/M_i$ times in that time. So:</p>

<p>$$g_i = 10^{-3 M_i/(f_s T_{60})}$$</p>

<p>Because each gain is tied to its own line's length, every line decays along the same envelope, whatever its length. Frequency-dependent decay works the same way: the gain becomes a filter whose magnitude at frequency $f$ is $10^{-3M_i/(f_s T_{60}(f))}$. I approximate that with a one-pole lowpass per line, with the gain set from the mid-band decay time and the damping from the tilt between the low and high bands. Jot and Chaigne (1991) describe this design in detail.</p>

<p>The rest of the design is about density. The feedback matrix is a normalized Hadamard matrix, built by doubling:</p>

<p>$$H_1 = \\begin{pmatrix} 1 \\end{pmatrix}, \\qquad H_{2N} = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} H_N &amp; H_N \\\\ H_N &amp; -H_N \\end{pmatrix}$$</p>

<p>It mixes every line into every other line with equal strength, and it can be applied as a fast transform in $N\\log_2 N$ additions instead of a full matrix multiply. The 16 delay lengths are different prime numbers of samples between 19 and 78 ms, so their echoes never line up into an audible pattern. The predelay, the gap before the reverb starts, comes from the first bin of the echogram that holds energy.</p>

<p><strong>Where it stands:</strong> the reverb is audible and its decay follows the tracer, but it isn't finished. The output is still mono, the same signal on both channels, which collapses the tail into the middle of your head; the plan is to send half of the lines to each ear. Changing the predelay while the reverb plays may be what causes occasional clicks, so predelay changes will get a crossfade. The FDN also has a self-test: it feeds itself an impulse with a hand-typed $T_{60}$, runs the same Schroeder analysis on its own output and checks that it measures what it was asked for. That way a bug in the tracer can't be hidden by tuning the reverb, or the other way around.</p>
<!-- TODO: add the rta.TestFDN result (requested vs measured T30) and a short audio clip. -->

<h1 id="threads">Keeping the audio thread fed</h1>

<p>Audio has a hard deadline. The audio callback has to deliver a buffer every few milliseconds, and if it waits on anything, you hear a dropout rather than a hitch. Ray tracing takes far longer than a buffer, so the two never share a lock.</p>
<ul>
<li>Tracing runs on background tasks: per-source occlusion about 30 times a second, the room probe 4 times a second.</li>
<li>Each task publishes only small derived results, like six band values or a few decay times, through a seqlock. The writer bumps a version counter before and after writing; a reader copies the data and simply retries if the counter was odd or changed while it was copying. The audio thread never waits for the tracer.</li>
<li>Nothing jumps on the audio side. Gains and filter coefficients ramp across a buffer, and reverb settings are only updated when they change by more than a small threshold.</li>
</ul>

<h1 id="status">Where it stands</h1>

<div class="rta-table-wrap"><table class="rta-table">
<thead><tr><th>Part</th><th>Technique</th><th>Status</th></tr></thead>
<tbody>
<tr><td>Acoustic materials</td><td>Measured absorption tables, energy budget per band</td><td><span class="rta-badge rta-ok">Working</span></td></tr>
<tr><td>Transmission</td><td>Sharp's model, single and double leaf</td><td><span class="rta-badge rta-ok">Working</span></td></tr>
<tr><td>Occlusion</td><td>Direct path plus next-event estimation, three-band voice filter</td><td><span class="rta-badge rta-ok">Working</span></td></tr>
<tr><td>Distance and air</td><td>Inverse-square law, ISO 9613-1 air absorption (the direct path still uses a simpler lowpass)</td><td><span class="rta-badge rta-ok">Working</span></td></tr>
<tr><td>Echogram</td><td>Diffuse rain, Russian roulette, running average</td><td><span class="rta-badge rta-ok">Working</span></td></tr>
<tr><td>Reverberation time</td><td>Schroeder integration, EDT, T20, T30, Eyring cross-check; not validated yet</td><td><span class="rta-badge rta-prog">In progress</span></td></tr>
<tr><td>Reverb</td><td>16-line FDN with per-band decay; audible, mono, being tuned</td><td><span class="rta-badge rta-prog">In progress</span></td></tr>
<tr><td>Validation</td><td>Shoebox room: traced mean free path against 4V/S, T30 against Eyring</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
<tr><td>Stereo reverb</td><td>Decorrelated left and right outputs</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
<tr><td>Diffraction</td><td>Sound bending around edges and through openings</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
<tr><td>Spatialization</td><td>Direction of arrival for reflections, HRTFs</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
<tr><td>Multiple rooms</td><td>A late field per room instead of one per listener</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
<tr><td>Performance</td><td>Profiling instead of estimates</td><td><span class="rta-badge rta-plan">Planned</span></td></tr>
</tbody>
</table></div>

<h2>Known limitations</h2>
<ul>
<li><strong>Low frequencies.</strong> Rays can't represent diffraction or room modes, and below a few hundred hertz both matter.</li>
<li><strong>One late field per listener.</strong> The probe describes the room you're standing in. A source in the next room excites a different reverb, which a single shared field can't express.</li>
<li><strong>Transmission inputs.</strong> Sharp's model gets asked about porous materials, small objects and gaps it wasn't built for, with thicknesses that are often invented.</li>
<li><strong>Scattering per material</strong> instead of per surface shape.</li>
<li><strong>Occlusion is a heuristic:</strong> a plausible estimate per band, not a solution of energy transport.</li>
</ul>

<h1 id="references">References</h1>
<ul>
<li><a href="https://www.semanticscholar.org/paper/Prediction-Methods-for-the-Sound-Transmission-of-Sharp/da36c0562c4a5f69b9e05524ee3c9b2c75772817">B. H. Sharp (1978), "Prediction Methods for the Sound Transmission of Building Elements", Noise Control Engineering 11(2), 53–63</a></li>
<li>M. Long, <em>Architectural Acoustics</em>, chapter 9, "Sound Transmission Loss" (Elsevier)</li>
<li><a href="https://www.insul.co.nz/tech-info/">INSUL, technical background on single and double panel transmission loss</a></li>
<li>H. Kuttruff, <em>Room Acoustics</em> (CRC Press)</li>
<li>M. Vorländer, <em>Auralization</em> (Springer)</li>
<li>M. R. Schroeder (1965), "New Method of Measuring Reverberation Time", Journal of the Acoustical Society of America 37, 409–412</li>
<li>C. F. Eyring (1930), "Reverberation Time in 'Dead' Rooms", Journal of the Acoustical Society of America 1, 217–241</li>
<li>J.-M. Jot and A. Chaigne (1991), "Digital Delay Networks for Designing Artificial Reverberators", 90th AES Convention</li>
<li>D. Schröder (2011), <em>Physically Based Real-Time Auralization of Interactive Virtual Environments</em>, PhD thesis, RWTH Aachen (diffuse rain)</li>
<li><a href="https://graphics.stanford.edu/papers/veach_thesis/thesis-bw.pdf">E. Veach (1997), "Robust Monte Carlo Methods for Light Transport Simulation", PhD thesis, Stanford (next-event estimation, Russian roulette)</a></li>
<li>ISO 354 (absorption in a reverberation room), ISO 17497-1 (scattering), ISO 9613-1 (air absorption), ISO 3382-1 (room acoustic parameters)</li>
<li><a href="https://github.com/ValveSoftware/steam-audio">Steam Audio</a>, an open-source reference for how a production system handles the same problems</li>
</ul>

</div>

`,
    tags: ['Audio', 'Ray Tracing', 'Acoustics', 'DSP']
};
