import type { ReactNode } from 'react';

export function Hero(): ReactNode {
  return (
    <section className="hero container-fluid" id="top">
      <div className="row align-items-center g-5">
        <div className="col-lg-6 hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> A slower kind of shopping
          </p>
          <h1>
            Everyday things,
            <br />
            <em>made more meaningful.</em>
          </h1>
          <p className="hero-description">
            Useful objects with a little more thought behind them. Made to be kept, used and loved.
          </p>
          <a className="hero-link" href="#shop">
            Explore the collection <span aria-hidden="true">↓</span>
          </a>
          <div className="hero-note">
            <span>✳</span>
            <span>
              Small batch
              <br />
              made with care
            </span>
          </div>
        </div>
        <div className="col-lg-6">
          <div
            className="hero-art"
            role="img"
            aria-label="A curated collection of ceramic, cotton and paper goods"
          >
            <div className="art-sun" />
            <div className="art-arch" />
            <div className="art-vase vase-one">
              <i />
            </div>
            <div className="art-vase vase-two">
              <i />
            </div>
            <div className="art-book book-one" />
            <div className="art-book book-two" />
            <div className="art-leaf leaf-one" />
            <div className="art-leaf leaf-two" />
            <div className="art-card">
              GOOD THINGS
              <br />
              <span>TAKE TIME</span>
            </div>
            <div className="art-caption">
              Objects for your everyday ritual <span>01 — 06</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
