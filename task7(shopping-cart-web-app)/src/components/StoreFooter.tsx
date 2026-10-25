import type { ReactNode } from 'react';

export function StoreFooter(): ReactNode {
  return <><section className="promise-strip container-fluid" id="story"><div className="row g-3">{[
    ['✳', 'Made to last', 'Thoughtful materials, built for everyday.'], ['⌁', 'Good by nature', 'Small batches, lighter footprint.'], ['♡', 'People first', 'Made with care, from start to finish.']
  ].map(([icon, title, description]) => <div className="col-md-4" key={title}><div className="promise-item"><span className="promise-icon">{icon}</span><div><strong>{title}</strong><span>{description}</span></div></div></div>)}</div></section>
  <footer className="site-footer container-fluid" id="journal"><a className="brand footer-brand" href="#top"><span className="brand-mark">c</span><span>common<span className="brand-light">goods</span></span></a><span>Good things for the everyday.</span><span>© 2025 Common Goods Studio</span></footer></>;
}
