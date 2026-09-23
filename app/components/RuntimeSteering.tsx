import katex from 'katex';

// Runtime rules from method_new.tex: robust-fixed-pt-bellman (undiscounted), robust-filter-rollout, and
// robust-sampling-based-steering. “safe” replaces the manuscript's shield icon.
const equations = {
  bellman: String.raw`V^{\mathrm{safe}}_{\mathrm{rob}}(z)=\min\Big\{\ell_z(z),\;\max_{a\in\mathcal A}\;\colorbox{#FFCC80}{$\displaystyle\min_{f_z^d\in\colorbox{#79D8C4}{$\scriptstyle\mathcal F(z,a)$}}\mathbb E_{z'\sim f_z^d(\cdot\mid z,a)}$}\big[V^{\mathrm{safe}}_{\mathrm{rob}}(z')\big]\Big\}`,
  filtering: String.raw`\pi_{\mathrm{rob}}(z)=\begin{cases}
      \pi^{\mathrm{task}}(z), & \text{if }\colorbox{#FFCC80}{$\mathbb E_{z'\sim f_z^{\star}(\cdot\mid z,\pi^{\mathrm{task}}(z))}$}\big[V^{\mathrm{safe}}_{\mathrm{rob}}(z')\big]>0,\\[.4em]
      \pi^{\mathrm{safe}}_{\mathrm{rob}}(z), & \text{otherwise}.
    \end{cases}`,
  steering: String.raw`\pi_{\mathrm{rob}}(z)=\underset{\mathbf a\in\{\mathbf a^{(k)}\}_{k=1}^{K}}{\arg\min}\;\colorbox{#FFCC80}{$\displaystyle\mathbb E_{\mathbf z'\sim f_z^{\pi_d}(\cdot\mid z,\mathbf a)}$}\big[C(\mathbf z')\big]`,
};
const rendered = Object.fromEntries(Object.entries(equations).map(([key,tex]) => [key,katex.renderToString(tex,{
  displayMode:true,throwOnError:true,output:'htmlAndMathml',trust:false,
})]));

export function RuntimeSteering(){return <section className="section runtime-steering" id="runtime-steering" aria-labelledby="runtime-heading">
  <div className="section-intro"><h2 id="runtime-heading">Use case: Robust Runtime Policy Steering</h2><p>This latent-space robust optimization can be used to steer a task policy π<sup>task</sup> at runtime, preventing hard-to-model failures under uncertainty. We instantiate it for two policy-steering paradigms, replacing nominal world-model imaginations with pessimistic yet plausible ones.</p></div>
  <div className="runtime-cards">
    <article className="runtime-card">
      <h3>Latent Safety Filter</h3>
      <p>Safeguard π<sup>task</sup> with least-restrictive filtering: evaluate the safety of the action proposed by the task policy, and intervene with the robust safety policy only when that action is doomed to fail.</p>
      <div className="typeset-equation runtime-equation" dangerouslySetInnerHTML={{__html:rendered.filtering}}/>
      <p>The robust safety value and safety policy are learned with pessimistic imaginations induced by the <mark className="highlight-orange">latent disturbance</mark>:</p>
      <div className="typeset-equation runtime-equation" dangerouslySetInnerHTML={{__html:rendered.bellman}}/>
    </article>
    <article className="runtime-card">
      <h3>Sample &amp; Verify</h3>
      <p>Samples K candidate action sequences a<sup>(k)</sup> ∼ π<sup>task</sup>(z), evaluates each with world-model imaginations, and executes the one with the lowest expected cost.</p>
      <div className="typeset-equation runtime-equation" dangerouslySetInnerHTML={{__html:rendered.steering}}/>
      <p className="runtime-note">The <mark className="highlight-orange">learned latent disturbance</mark> generates adverse futures for each candidate, so action selection accounts for calibrated system uncertainty.</p>
    </article>
  </div>
</section>;}
