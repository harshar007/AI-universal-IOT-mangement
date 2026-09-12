import React from 'react';
import { Github, Mail, Linkedin, Award, BookOpen, Heart, Code, Shield, Cpu, Sparkles, CheckCircle2, Terminal, Database, Wifi } from 'lucide-react';
import '../css/Developers.css';

export default function Developers() {
  const developer = {
    name: 'Harshar A T',
    role: 'Full Stack Developer & Systems Architect',
    tagline: 'Sole Creator & Lead Developer — 100% End-to-End Engineering',
    bio: 'Sole creator and lead full-stack developer of the Nunnarri Smart IoT Platform. Architected and engineered the entire ecosystem from the ground up — including the React frontend dashboard, Node.js gateway, Aedes MQTT broker, Model Context Protocol (MCP) server, C++ microcontroller firmware (ESP32/ESP8266), dual-database PostgreSQL architecture, and on-device AI integration.',
    email: 'harshar007@gmail.com',
    github: 'https://github.com/harshar007',
    linkedin: 'https://linkedin.com',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HarsharAT',
    skills: [
      { category: 'Frontend Engineering', items: ['React 18 (Vite)', 'Material Design 3', 'WebSockets & Live Telemetry', 'Dynamic Virtual Pin Widgets'] },
      { category: 'Backend & IoT Gateway', items: ['Node.js & Express API', 'Embedded Aedes MQTT Broker', 'JWT Security & Rate Limiting', 'Dual PostgreSQL Architecture'] },
      { category: 'Embedded & Firmware', items: ['ESP32 & ESP8266 C++', 'PubSubClient & MQTT Handshakes', 'ArduinoJson Payload Parsing', 'Over-The-Air (OTA) Updates'] },
      { category: 'AI & Protocols', items: ['Model Context Protocol (MCP)', 'TinyLlama Local LLM', 'Automated Anomaly Detection', 'REST & SSE Transports'] },
    ],
    stats: [
      { label: 'Role', value: 'Sole Developer' },
      { label: 'Project Status', value: '100% Completed' },
      { label: 'Architecture', value: 'Full-Stack + IoT + MCP' },
      { label: 'Academic Scope', value: 'Final Year Project' },
    ]
  };

  return (
    <div className="page">
      {/* Header Section */}
      <header className="dashboard-header">
        <div>
          <h1>Developer Profile</h1>
          <p className="dashboard-subtitle">Designed, architected, and engineered solely by Harshar A T</p>
        </div>
      </header>

      <div className="developers-container">

        {/* Solo Developer Showcase Card */}
        <section className="solo-dev-card glass-panel">
          <div className="solo-dev-glow"></div>
          
          <div className="solo-dev-header">
            <div className="solo-avatar-wrapper">
              <img 
                src={developer.avatar} 
                alt={`${developer.name}'s Avatar`} 
                className="solo-avatar"
              />
              <div className="solo-badge-verified" title="Sole Author & Verified Developer">
                <CheckCircle2 size={16} />
              </div>
            </div>

            <div className="solo-header-info">
              <div className="badge-wrapper">
                <span className="solo-role-badge">
                  <Sparkles size={14} />
                  {developer.tagline}
                </span>
              </div>
              <h2 className="solo-dev-name">{developer.name}</h2>
              <span className="solo-dev-role">{developer.role}</span>
              <p className="solo-dev-bio">{developer.bio}</p>

              {/* Social / Contact Links */}
              <div className="solo-dev-socials">
                <a href={`mailto:${developer.email}`} className="solo-social-btn" title="Send Email">
                  <Mail size={16} />
                  <span>{developer.email}</span>
                </a>
                <a href={developer.github} target="_blank" rel="noopener noreferrer" className="solo-social-btn" title="GitHub Profile">
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
                <a href={developer.linkedin} target="_blank" rel="noopener noreferrer" className="solo-social-btn" title="LinkedIn Profile">
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="solo-stats-grid">
            {developer.stats.map((stat, idx) => (
              <div className="solo-stat-item" key={idx}>
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
              </div>
            ))}
          </div>

          {/* Core Competencies & Skills */}
          <div className="solo-skills-section">
            <h3 className="solo-skills-title">
              <Code size={18} className="text-cyan" />
              <span>Full-Stack Engineering Competencies</span>
            </h3>
            <div className="solo-skills-grid">
              {developer.skills.map((skillGroup, idx) => (
                <div className="skill-group-card" key={idx}>
                  <h4>{skillGroup.category}</h4>
                  <ul>
                    {skillGroup.items.map((item, iIdx) => (
                      <li key={iIdx}>
                        <CheckCircle2 size={13} className="text-cyan" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Project Background & Architecture */}
        <section className="project-info-card glass-panel">
          <div className="project-badge">
            <Award className="badge-icon text-cyan" size={24} />
            <span>Academic Final Year Project Contribution</span>
          </div>
          <h2>Nunnarri IoT Gateway Console</h2>
          <p>
            Nunnarri was designed and engineered as a comprehensive final year engineering project by Harshar A T. 
            It serves as an enterprise-grade bridge connecting microcontrollers (ESP8266 & ESP32) to standard web platforms 
            via high-performance MQTT brokers, real-time WebSocket streams, Model Context Protocol (MCP) AI integrations, 
            Blynk-style virtual pin mapping, dynamic widgets, and automated device provisioning.
          </p>
          <div className="project-tech-pills">
            <span className="tech-pill"><Code size={12} /> React / Vite SPA</span>
            <span className="tech-pill"><Cpu size={12} /> Node.js / Express Gateway</span>
            <span className="tech-pill"><Database size={12} /> Dual PostgreSQL DB</span>
            <span className="tech-pill"><Wifi size={12} /> Aedes MQTT Broker</span>
            <span className="tech-pill"><Sparkles size={12} /> Model Context Protocol (MCP)</span>
            <span className="tech-pill"><Terminal size={12} /> ESP32 / ESP8266 C++ Firmware</span>
          </div>
        </section>

        {/* Technology Specifications Breakdown */}
        <section className="tech-stack-card glass-panel" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code className="text-cyan" />
            <span>Sole Engineering Specifications & Modules</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-cyan)', fontWeight: '600', marginBottom: '0.5rem' }}>Frontend Client Console</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                <li><strong>React (Vite)</strong>: Single Page Application with dynamic state rendering.</li>
                <li><strong>Material 3 & CSS3</strong>: Tailored dark-mode glassmorphism and animations.</li>
                <li><strong>Lucide Icons</strong>: Lightweight, optimized SVG vector icons.</li>
                <li><strong>Axios & WebSockets</strong>: Synchronous REST operations and live telemetry streams.</li>
              </ul>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-green)', fontWeight: '600', marginBottom: '0.5rem' }}>Backend Systems Core</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                <li><strong>Node.js (Express)</strong>: RESTful API routing and request middleware.</li>
                <li><strong>PostgreSQL Database</strong>: Relational tables for accounts and device registries.</li>
                <li><strong>Aedes MQTT Broker</strong>: Lightweight pub/sub messaging engine (Port 1883).</li>
                <li><strong>JWT Security</strong>: JSON Web Token generation for session validation.</li>
              </ul>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-violet)', fontWeight: '600', marginBottom: '0.5rem' }}>IoT Microcontroller Nodes</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                <li><strong>ESP8266 & ESP32</strong>: Hardware chips connecting over Wi-Fi.</li>
                <li><strong>PubSubClient C++</strong>: Manages MQTT broker handshake and publications.</li>
                <li><strong>ArduinoJson</strong>: Serialization/deserialization of JSON payloads.</li>
                <li><strong>OTA Library</strong>: Remotely triggers firmware update flashes.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Infrastructure & Deployment */}
        <section className="infra-card glass-panel" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} className="text-cyan" />
            <span>Infrastructure, Cloud & Containerization</span>
          </h3>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li><strong>Docker</strong>: Multi-stage containerized backend services, MCP server, and frontend build pipelines.</li>
            <li><strong>MCP Architecture</strong>: 20 diagnostic & control tools, 5 live resources, 3 AI prompt templates.</li>
            <li><strong>NGINX</strong>: Reverse proxy, static asset serving, and TLS termination.</li>
            <li><strong>Server Handling</strong>: Node.js Express server with JWT auth, PostgreSQL connection pooling, and Aedes MQTT broker.</li>
          </ul>
        </section>

        {/* Footer Note */}
        <footer className="developer-footer glass-panel">
          <Heart size={16} className="text-red animate-pulse" />
          <span>Designed, engineered, and completed solely by <strong>Harshar A T</strong> as a comprehensive academic final year project.</span>
        </footer>

      </div>
    </div>
  );
}
