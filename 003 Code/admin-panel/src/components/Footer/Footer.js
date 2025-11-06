import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © 2024 유성구청. 모든 권리 보유.
        </p>
        <p className="footer-version">
          유성안심문자 v1.0.0
        </p>
      </div>
    </footer>
  );
};

export default Footer;