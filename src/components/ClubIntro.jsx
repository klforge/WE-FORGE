import React from 'react';
import PixelSnow from './PixelSnow';
import './ClubIntro.css';

const ClubIntro = () => {
  return (
    <section className="club-intro">
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <PixelSnow 
          color="#ffffff"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={0.8}
          density={0.1}
          direction={125}
          brightness={1}
          depthFade={8}
          farPlane={20}
          gamma={0.4545}
          variant="square"
        />
      </div>
      <div className="club-intro__container" style={{ position: 'relative', zIndex: 1 }}>
        <span className="club-intro__eyebrow">What is KLFORGE Club</span>
        <h2 className="club-intro__heading">
          <span className="club-intro__highlight">Code the Future.</span><br />
          Create the Impossible.<br />
          Connect the Innovators.
        </h2>
        <p className="club-intro__subheading">
          KLForge is a community where developers collaborate,
          build impactful ideas, and grow through technology.
        </p>
      </div>
    </section>
  );
};

export default ClubIntro;
