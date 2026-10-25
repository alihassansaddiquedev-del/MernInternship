import type { ReactNode } from 'react';

interface SiteHeaderProps {
  itemCount: number;
  onBagOpen: () => void;
}

export function SiteHeader({ itemCount, onBagOpen }: SiteHeaderProps): ReactNode {
  return (
    <>
      <div className="announcement-bar">
        <span>Thoughtful things for everyday living</span>
        <span>
          Complimentary shipping over $75 <span aria-hidden="true">↗</span>
        </span>
      </div>
      <header className="site-header container-fluid">
        <a className="brand" href="#top" aria-label="Common Goods home">
          <span className="brand-mark">c</span>
          <span>
            common<span className="brand-light">goods</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="active" href="#shop">
            Shop all
          </a>
          <a href="#story">Our story</a>
          <a href="#journal">Journal</a>
        </nav>
        <div className="header-actions">
          <button className="search-button" type="button" aria-label="Search products">
            ⌕
          </button>
          <button
            className="btn bag-button"
            type="button"
            onClick={onBagOpen}
            aria-label={`Open shopping bag, ${itemCount} items`}
          >
            <span aria-hidden="true">♧</span> Bag{' '}
            <span className="badge rounded-pill">{itemCount}</span>
          </button>
        </div>
      </header>
    </>
  );
}
