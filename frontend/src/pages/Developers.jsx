import React from 'react';
import { Github, Mail, Linkedin, Award, BookOpen, Heart, Code, Shield, Cpu, Users } from 'lucide-react';
import '../css/Developers.css';

export default function Developers() {
  const team = [
    {
      name: 'Harshar R',
      role: 'Project Lead & Full-Stack Developer',
      bio: 'Specializes in frontend systems engineering, React architectures, and state synchronization frameworks.',
      email: 'harshar007@gmail.com', // Placeholder / standard email format
      github: 'https://github.com/harshar007',
      linkedin: 'https://linkedin.com',
      avatar: '/avatar_harshar.png'
    },
    {
      name: 'Prabha S',
      role: 'Backend & Database Engineer',
      bio: 'Focuses on database design, scaling queries in PostgreSQL, security protocols, and secure credential handling.',
      email: 'prabha@gmail.com',
      github: 'https://github',
      linkedin: 'https://linkedin.com',
      avatar: '/avatar_prabha.png'
    },
    {
      name: 'Arun Kumar K',
      role: 'IoT Hardware & Firmware Developer',
      bio: 'Designs hardware integrations, micro-controller programming (ESP8266/ESP32), and MQTT broker handshakes.',
      email: 'arunkumar@gmail.com',
      github: 'https://github',
      linkedin: 'https://linkedin.com',
      avatar: '/avatar_arun.png'
    },
    {
      name: 'Sanjay M',
      role: 'UI/UX Designer & QA Engineer',
      bio: 'Crafts user experiences, styles responsive layouts, manages asset packaging, and performs integration testing.',
      email: 'sanjay@gmail.com',
      github: 'https://github',
      linkedin: 'https://linkedin.com',
      avatar: '/avatar_sanjay.png'
    }
  ];

  return (
    <div className="main-content">
      {/* Header Section */}
      <header className="dashboard-header">
        <div>
          <h1>Project Team & Developers</h1>
          <p className="dashboard-subtitle">Meet the minds behind the Nexus IoT Gateway Console</p>
        </div>
      </header>

      <div className="developers-container">
        
        {/* Project Intro Panel */}
        <section className="project-info-card glass-panel">
          <div className="project-badge">
            <Award className="badge-icon text-cyan" size={24} />
            <span>Academic Final Year Project</span>
          </div>
          <h2>Nexus IoT Gateway Console</h2>
          <p>
            Nexus was designed and engineered as a comprehensive final year engineering project. It serves as a bridge 
            connecting microcontrollers (like ESP8266 & ESP32) to standard web platforms via high-performance MQTT brokers 
            and real-time WebSocket streams, featuring Blynk-style virtual pin mapping, dynamic widgets, and auto-registration.
          </p>
          <div className="project-tech-pills">
            <span className="tech-pill"><Code size={12} /> React / Vite</span>
            <span className="tech-pill"><Cpu size={12} /> Node.js / Express</span>
            <span className="tech-pill"><Shield size={12} /> PostgreSQL</span>
            <span className="tech-pill"><Users size={12} /> Aedes MQTT</span>
          </div>
        </section>

        {/* Technology Stack Details */}
        <section className="tech-stack-card glass-panel" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code className="text-cyan" />
            <span>Full-Stack & IoT Technology Specifications</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-cyan)', fontWeight: '600', marginBottom: '0.5rem' }}>Frontend Client Console</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                <li><strong>React (Vite)</strong>: Single Page Application with dynamic state rendering.</li>
                <li><strong>Vanilla CSS3</strong>: Tailored dark-mode glassmorphism and animations.</li>
                <li><strong>Lucide Icons</strong>: Lightweight, optimized SVG vector icons.</li>
                <li><strong>Axios & WebSockets</strong>: Synchronous REST operations and live telemetry streams.</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-green)', fontWeight: '600', marginBottom: '0.5rem' }}>Backend Systems Core</h4>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                <li><strong>Node.js (Express)</strong>: RESTful API routing and request middleware.</li>
                <li><strong>PostgreSQL Database</strong>: Relational tables for accounts and device registries.</li>
                <li><strong>Aedes MQTT Broker</strong>: Lightweight pub/sub messaging engine (Port 1883).</li>
                <li><strong>JWT Security</strong>: JSON Web Token generation for session validation.</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={12} className="text-cyan" />
              <span>Infrastructure, Cloud & Containerization</span>
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li><strong>Docker</strong>: Containerized backend services and frontend build pipelines.</li>
              <li><strong>Kubernetes (optional)</strong>: Orchestrates scaling deployments across clusters.</li>
              <li><strong>NGINX</strong>: Reverse proxy, static asset serving, and TLS termination.</li>
              <li><strong>CI/CD</strong>: GitHub Actions workflow for automated testing, Docker image build, and deployment.</li>
              <li><strong>Cloud Platforms</strong>: Designed for deployment on AWS, GCP, or Azure with environment‑specific configuration.</li>
              <li><strong>Server Handling</strong>: Node.js Express server with JWT auth, PostgreSQL connection pooling, and Aedes MQTT broker integration.</li>
              <li><strong>Monitoring</strong>: Basic health endpoints and logs; can integrate Prometheus/Grafana.</li>
            </ul>
          </section>
{/* Large Language Model (LLM) – TinyLlama */}
<section className="llm-card glass-panel" style={{ padding: '2rem', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <Code size={12} className="text-cyan" />
    <span>Large Language Model – TinyLlama</span>
  </h3>
  <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
    <li><strong>Model</strong>: TinyLlama – lightweight, open‑source LLaMA‑based LLM.</li>
    <li><strong>Usage</strong>: Provides on‑device natural‑language processing for chat‑with‑your‑data, command parsing, and device‑status summarisation.</li>
    <li><strong>Deployment</strong>: Loaded in the <code>ai-backend</code> service (started with <code>npm start</code>) and exposed through a REST endpoint <code>/api/llm</code>.</li>
    <li><strong>Benefits</strong>: Small memory footprint, fast inference for short prompts, fully customizable, no external API costs.</li>
    <li><strong>Integration</strong>: Communicates with the frontend via Axios calls; results can be displayed in the console UI.</li>
  </ul>
</section>
        {/* Team Grid */}
        <div className="team-grid">
          {team.map((member, index) => (
            <div className="team-card glass-panel" key={index}>
              <div className="team-avatar-wrapper">
                <img 
                  src={member.avatar} 
                  alt={`${member.name}'s Avatar`} 
                  className="team-avatar"
                  onError={(e) => {
                    // Fallback to initial if image is not copied yet
                    e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`;
                  }}
                />
              </div>
              <div className="team-card-content">
                <h3 className="member-name">{member.name}</h3>
                <span className="member-role">{member.role}</span>
                <p className="member-bio">{member.bio}</p>
                
                {/* Social Links */}
                <div className="member-socials">
                  <a href={`mailto:${member.email}`} className="social-link" title="Email Operator">
                    <Mail size={16} />
                  </a>
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub Profile">
                    <Github size={16} />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn Profile">
                    <Linkedin size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <footer className="team-footer glass-panel">
          <Heart size={16} className="text-red animate-pulse" />
          <span>Designed & developed with passion as a final year academic contribution.</span>
        </footer>

      </div>
    </div>
  );
}
