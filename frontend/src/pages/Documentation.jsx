import React from 'react';
import { Code, Cpu, Database, Server, Github, Cloud, BookOpen, Shield, Users, Link, AlertCircle, ArrowRight } from 'lucide-react';
import '../css/Documentation.css';

export default function Documentation() {
  const sections = [
    {
      id: 'overview',
      title: 'Project Overview',
      content: `Nexus IoT Gateway Console is a full‑stack, cloud‑ready IoT platform that connects ESP8266/ESP32 micro‑controllers to a modern web console. It provides device registration, token regeneration, real‑time telemetry via MQTT, and an integrated LLM (TinyLlama) for natural‑language interaction.`
    },
    {
      id: 'features',
      title: 'Key Features',
      content: `• Device registration & per‑user scoping\n• JWT‑protected REST API\n• Aedes MQTT broker with OTA support\n• Real‑time WebSocket telemetry\n• TinyLlama LLM for chat‑with‑your‑data\n• Dockerised deployment & optional Kubernetes\n• CI/CD with GitHub Actions\n• Responsive glass‑morphism UI built with React + Vite`
    },
    {
      id: 'architecture',
      title: 'Architecture Diagram',
      // placeholder image path – you can replace with a real diagram later
      image: '/architecture-diagram.png',
      content: `The diagram below illustrates how the front‑end, back‑end, MQTT broker, PostgreSQL and the TinyLlama model communicate.`
    },
    {
      id: 'techStack',
      title: 'Technology Stack',
      content: `
        <ul className="tech-list">
          <li><Code size={12} className="icon"/> React (Vite) – SPA UI</li>
          <li><Cpu size={12} className="icon"/> Node.js / Express – API layer</li>
          <li><Database size={12} className="icon"/> PostgreSQL – relational data store</li>
          <li><Users size={12} className="icon"/> Aedes MQTT – device messaging</li>
          <li><Shield size={12} className="icon"/> JWT – stateless auth</li>
          <li><Cloud size={12} className="icon"/> Docker / optional Kubernetes – container orchestration</li>
          <li><BookOpen size={12} className="icon"/> TinyLlama – on‑device LLM</li>
        </ul>`
    },
    {
      id: 'backend',
      title: 'Backend API',
      content: `All endpoints are under **/api** and protected by JWT. Highlights:\n\n- **POST /api/devices/register** – registers a device with a userId.\n- **GET /api/devices** – lists devices owned by the authenticated user.\n- **POST /api/devices/:id/regenerate-token** – issues a new secret key.\n- **POST /api/llm** – forwards a prompt to the TinyLlama model and returns the response.\n\nSwagger/OpenAPI docs are available at **/api/docs** when the server runs in dev mode.`
    },
    {
      id: 'frontendSetup',
      title: 'Frontend Setup',
      content: `1. Install dependencies: \`npm install\`\n2. Start the dev server: \`npm run dev\` (Vite runs on http://localhost:5173)\n3. The UI communicates with the backend via Axios (configured in \`src/utils/api.js\`).\n4. Environment variables are loaded from a .env file – see \`.env.example\` for the required keys (REACT_APP_API_URL, REACT_APP_MQTT_URL, etc.).`
    },
    {
      id: 'llm',
      title: 'Large Language Model – TinyLlama',
      content: `TinyLlama is an open‑source, lightweight LLaMA‑based model that runs inside the \`ai-backend\` service.\n\n- **Endpoint**: POST /api/llm\n- **Payload**: { prompt: string }\n- **Response**: { answer: string }\n- **Advantages**: low memory usage, fast inference for short prompts, no external API cost, fully customizable.`
    },
    {
      id: 'deployment',
      title: 'Deployment & CI/CD',
      content: `The project is containerised with Docker. A typical production stack includes:\n\n- **nginx** – reverse proxy & TLS termination\n- **postgres** – managed database (AWS RDS, GCP CloudSQL, or Azure PostgreSQL)\n- **backend** – Node.js/Express container\n- **frontend** – Vite‑build static files served by nginx\n- **mqtt** – Aedes broker container\n\nGitHub Actions automatically lint, test, build Docker images and push them to the registry on every push to the main branch.`
    },
    {
      id: 'contributing',
      title: 'Contributing',
      content: `We welcome contributions! Please fork the repository and submit a PR. Follow the existing code style (ESLint + Prettier) and write unit tests for new features. For large changes, open an issue first.`
    },
    {
      id: 'license',
      title: 'License',
      content: `This project is licensed under the MIT License. See the LICENSE file for details.`
    }
  ];

  return (
    <div className="doc-container glass-panel">
      <header className="doc-header">
        <h1 className="title"><Code size={24} className="text-cyan"/> Nexus IoT Gateway Console Documentation</h1>
        <p className="subtitle">Comprehensive guide for developers, operators and contributors.</p>
      </header>
      {sections.map(sec => (
        <section key={sec.id} id={sec.id} className="doc-section">
          <h2 className="section-title"><Code size={20} className="icon"/> {sec.title}</h2>
          {sec.image && (
            <div className="diagram-wrapper">
              <img src={sec.image} alt={`${sec.title} diagram`} className="diagram"/>
            </div>
          )}
          <div className="section-content" dangerouslySetInnerHTML={{ __html: sec.content.replace(/\n/g, '<br/>') }} />
        </section>
      ))}
      <footer className="doc-footer">
        <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="footer-link">
          <Github size={16} className="icon"/> View on GitHub
        </a>
      </footer>
    </div>
  );
}
