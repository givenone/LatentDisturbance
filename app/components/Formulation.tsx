import katex from 'katex';

export const formulations={
 physical:String.raw`\pi_{\mathrm{rob}}(s)=\underbrace{\underset{a\in\mathcal A}{\arg\min}}_{\text{choose an action}}\;\underbrace{\colorbox{#FFCC80}{$\displaystyle\max_{d\in\mathcal D}\;C\!\left(f(s,a,d)\right)$}}_{\text{worst-case cost}}`,
 latent:String.raw`\pi_{\mathrm{rob}}(z)=\underset{a\in\mathcal A}{\arg\min}\;\underbrace{\colorbox{#FFCC80}{$\displaystyle\max_{f_z^d(z,a)\in\colorbox{#79D8C4}{$\scriptstyle\mathcal F(z,a)$}}\;\mathbb E_{z'\sim f_z^d(\cdot\mid z,a)}$}}_{\text{worst-case latent disturbance}}\!\left[C(z')\right]`,
};
const rendered=Object.fromEntries(Object.entries(formulations).map(([key,tex])=>[key,katex.renderToString(tex,{displayMode:true,throwOnError:true,output:'htmlAndMathml',trust:false})]));
export function Formulation(){return <section className="section formulation" id="formulation"><div className="section-intro"><h2>How can we make robust decisions in a world model’s learned latent space?</h2></div>
 <h3>What is robust optimization?</h3><p>The same serving motion can place the egg on the plate or flip it, depending on unobserved friction or oil on the spatula. Robust optimization selects an action that remains effective under the <mark className="highlight-orange">worst-case disturbance</mark> in a specified set. This is a game: the disturbance maximizes the cost of the outcome, while the robot chooses an action that minimizes this worst-case cost.</p>
 <div className="typeset-equation" dangerouslySetInnerHTML={{__html:rendered.physical}}/>
 <h3>How do we do this in latent space?</h3><p>A world model learns compact latent states and their dynamics from observations. It does not explicitly represent disturbances such as friction or the amount of oil. Instead, uncertainty about these factors is reflected in its distribution of predicted next states.</p>
 <p><strong>Key idea:</strong> model a latent-space disturbance as a perturbation to the <mark className="highlight-blue">predicted next-state distribution</mark>. Optimize this disturbance within an <mark className="highlight-teal">uncertainty set of plausible latent dynamics</mark> to induce pessimistic world-model imaginations.</p>
 <div className="typeset-equation" dangerouslySetInnerHTML={{__html:rendered.latent}}/>
 <p>Here, the disturbance picks the most adverse latent dynamics within the uncertainty set, so that the world model imagines futures in which the action is most likely to fail, while the robot chooses the action that performs best even under these pessimistic imaginations. The uncertainty set must therefore include diverse transitions that are plausible under the system, while excluding implausible ones.</p>
 <p><strong>Challenge: Overly pessimistic disturbances.</strong> A nearby or high-likelihood latent state need not represent a physically feasible outcome. The disturbance can exploit these model errors and imagine impossible failures, making the robot overly conservative. The uncertainty set must cover adverse transitions while constraining implausible, <mark className="highlight-purple">out-of-distribution outcomes</mark>.</p>
 </section>;}
