import React from "react";
import "./Footer.css";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-left">
        <p>Frontend Developer passionate about creating beautiful and functional web experiences.</p>
      </div>
      
      <div className="footer-center">
        <h3>Connect</h3>
        <div className="social-icons">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
        </div>
      </div>

      <div className="footer-right">
        <p>© 2024 John Doe. All rights reserved.</p>
        <a href="#top" className="back-to-top">↑ Back to Top</a>
      </div>
    </footer>
  );
};

export default Footer;
