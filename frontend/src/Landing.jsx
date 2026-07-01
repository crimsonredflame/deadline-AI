import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// CONSTANTS & HELPERS
// ==========================================
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Expanded to 15 slots (8 AM to 10 PM) so night slots render perfectly
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); 

const COLORS = [
  { bg: 'rgba(255,122,51,0.16)', border: 'rgba(255,122,51,0.4)', text: '#FF9A5C' },
  { bg: 'rgba(255,77,109,0.16)', border: 'rgba(255,77,109,0.4)', text: '#FF7A9C' },
  { bg: 'rgba(94,178,255,0.16)', border: 'rgba(94,178,255,0.4)', text: '#7EC2FF' },
];

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  let hh = h > 12 ? h - 12 : h;
  if (hh === 0) hh = 12;
  return `${hh}:00 ${period}`;
}

const parseDayIndex = (dayStr) => {
  if (!dayStr) return 0;
  const d = dayStr.toLowerCase();
  if (d.includes('mon')) return 0;
  if (d.includes('tue')) return 1;
  if (d.includes('wed')) return 2;
  if (d.includes('thu')) return 3;
  if (d.includes('fri')) return 4;
  if (d.includes('sat')) return 5;
  if (d.includes('sun')) return 6;
  return 0; 
};

const parseStartHour = (dayStr) => {
  if (!dayStr) return 9;
  const match = dayStr.match(/(\d+):\d+\s*(AM|PM)/i);
  if (match) {
    let hour = parseInt(match[1]);
    let period = match[2].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour;
  }
  return 9; 
};

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ==========================================
// APP WORKSPACE PAGE COMPONENT
// ==========================================
export function AppPage({ onBack }) {
  const [blocks, setBlocks] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [thinking, setThinking] = useState(false);
  const colorCounter = useRef(0);

  const handleAddTask = async () => {
    const inputEl = document.getElementById('taskInput');
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    setThinking(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text })
      });
      const data = await response.json();
      
      const currentTaskColor = COLORS[colorCounter.current % COLORS.length];
      colorCounter.current += 1;

      // Map backend response steps seamlessly onto the correct calendar coordinates
      const sortedBlocks = data.steps.map((step, i) => {
        return {
          id: `${Date.now()}-${i}-${Math.random()}`,
          label: step.label,
          day: parseDayIndex(step.day),     
          startHour: parseStartHour(step.day), 
          color: currentTaskColor
        };
      });

      // Cleanly replace old positions to display the newly consolidated layout
      setBlocks(sortedBlocks);
      setTaskList(prev => [...prev, { label: text, color: currentTaskColor }]);
      if (inputEl) inputEl.value = ''; 
      
    } catch (err) {
      console.error(err);
      alert("Backend link offline. Confirm your uvicorn server is active on port 8000.");
    } finally {
      setThinking(false);
    }
  };

  const handleClearMatrix = async () => {
    try {
      await fetch('http://127.0.0.1:8000/api/reschedule', { method: 'POST' });
      setBlocks([]);
      setTaskList([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0E14', display: 'flex', flexDirection: 'column', color: '#F2F0E8', fontFamily: 'Inter, sans-serif' }}>
      {/* Workspace Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(242,240,232,0.08)', background: 'rgba(11,14,20,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(242,240,232,0.14)', borderRadius: 8, padding: '8px 14px', color: '#B8B6A8', cursor: 'pointer', fontSize: 13 }}>
            ← Landing
          </button>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Sorted Core Engine</span>
        </div>
        <button onClick={handleClearMatrix} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, padding: '8px 14px', color: '#FF7A9C', cursor: 'pointer', fontSize: 13 }}>
          Reset Calendar
        </button>
      </div>

      {/* Main Container View */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar Controls */}
        <div style={{ width: 340, padding: 24, borderRight: '1px solid rgba(242,240,232,0.08)', background: '#0F121A' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#A8A696' }}>Command Console</h3>
          <textarea 
            id="taskInput" 
            placeholder="Type your task here (e.g., Economics homework due Thursday)..." 
            rows={4} 
            style={{ width: '100%', boxSizing: 'border-box', background: '#141822', color: 'white', padding: 14, borderRadius: 10, border: '1px solid rgba(242,240,232,0.1)', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.5 }} 
          />
          <button 
            disabled={thinking}
            onClick={handleAddTask}
            style={{ width: '100%', marginTop: 12, padding: '14px', background: 'linear-gradient(135deg, #FF7A33, #FF4D6D)', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#0B0E14', fontWeight: 700, fontSize: 14, opacity: thinking ? 0.7 : 1 }}
          >
            {thinking ? 'Recalculating Timelines...' : 'Plan & Reschedule All'}
          </button>

          {taskList.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: '#6B6A60', letterSpacing: '0.05em', margin: '0 0 12px' }}>Active Projects</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {taskList.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(242,240,232,0.04)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color.text }} />
                    <span style={{ fontSize: 13, color: '#D2D0C4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Master Calendar Grid */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#0B0E14' }}>
          <div style={{ display: 'flex', minWidth: 700, background: '#11151D', borderRadius: 16, border: '1px solid rgba(242,240,232,0.06)', padding: 16 }}>
            
            {/* Time Axis Column */}
            <div style={{ width: 75, marginTop: 40 }}>
              {HOURS.map(h => (
                <div key={h} style={{ height: 60, color: '#5C5A50', fontSize: 11, fontWeight: 500, paddingRight: 8, textAlign: 'right' }}>
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Week Columns Grid */}
            <div style={{ display: 'flex', flex: 1 }}>
              {DAYS.map((dayName, dayIdx) => (
                <div key={dayName} style={{ flex: 1, borderLeft: '1px solid rgba(242,240,232,0.05)' }}>
                  <div style={{ textAlign: 'center', color: '#9C9A8E', fontWeight: 600, fontSize: 14, paddingBottom: 16, borderBottom: '1px solid rgba(242,240,232,0.05)' }}>
                    {dayName}
                  </div>
                  <div style={{ position: 'relative', background: 'rgba(255,255,255,0.005)' }}>
                    {HOURS.map(h => (
                      <div key={h} style={{ height: 60, borderBottom: '1px solid rgba(242,240,232,0.03)', boxSizing: 'border-box', padding: 2 }}>
                        {blocks
                          .filter(b => b.day === dayIdx && b.startHour === h)
                          .map(b => (
                            <div 
                              key={b.id} 
                              style={{ 
                                background: b.color.bg, 
                                border: `1px solid ${b.color.border}`, 
                                padding: '6px 8px', 
                                borderRadius: 8, 
                                fontSize: 11.5, 
                                lineHeight: 1.3,
                                color: b.color.text, 
                                height: '100%',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500
                              }}
                            >
                              {b.label}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// LANDING DESIGN BLOCKS
// ==========================================
const STEPS_DEMO = [
  { label: 'Research assignment framework', time: '45 min', day: 'Today, 4:00 PM' },
  { label: 'Draft code architecture baseline', time: '1.5 hr', day: 'Tomorrow, 10:00 AM' },
  { label: 'Execute local diagnostic tests', time: '45 min', day: 'Tomorrow, 3:00 PM' },
  { label: 'Final validation & secure submission', time: '5 min', day: 'Friday, 9:00 AM' },
];

function NavBar() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 48px', background: 'rgba(11,14,20,0.78)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(242,240,232,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #FF7A33, #FF4D6D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: '#0B0E14' }}>S</div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: '#F2F0E8', letterSpacing: '-0.02em' }}>Sorted</span>
      </div>
      <div style={{ display: 'flex', gap: 36, fontSize: 14.5, color: '#9C9A8E' }}>
        {['How it works', 'Agents', 'Integrations', 'Pricing'].map(item => (
          <a key={item} href="#" style={{ color: '#B8B6A8', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = '#F2F0E8'} onMouseLeave={e => e.target.style.color = '#B8B6A8'}>{item}</a>
        ))}
      </div>
      <button style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(242,240,232,0.16)', background: 'transparent', color: '#F2F0E8', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Sign in</button>
    </nav>
  );
}

function LiveDemo() {
  const [task, setTask] = useState('submit my ML assignment by Friday');
  const [stage, setStage] = useState('idle');
  const [visibleSteps, setVisibleSteps] = useState(0);

  const runDemo = () => {
    if (!task.trim()) return;
    setStage('thinking');
    setVisibleSteps(0);
    setTimeout(() => setStage('done'), 900);
  };

  useEffect(() => {
    if (stage === 'done') {
      STEPS_DEMO.forEach((_, i) => {
        setTimeout(() => setVisibleSteps(v => v + 1), i * 220);
      });
    }
  }, [stage]);

  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))', border: '1px solid rgba(242,240,232,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF4D6D' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF7A33' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#3C8A6E' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && runDemo()} placeholder="Type a task..." style={{ flex: 1, background: '#11151D', border: '1px solid rgba(242,240,232,0.12)', borderRadius: 10, padding: '12px 14px', color: '#F2F0E8', fontSize: 14.5, fontFamily: 'Inter, sans-serif', outline: 'none' }} />
        <button onClick={runDemo} style={{ padding: '0 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #FF7A33, #FF4D6D)', color: '#0B0E14', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>Plan it</button>
      </div>
      <div style={{ minHeight: 220 }}>
        {stage === 'idle' && <div style={{ color: '#6B6A60', fontSize: 13.5, textAlign: 'center', padding: '40px 0' }}>Your plan will appear here</div>}
        {stage === 'thinking' && <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#B8B6A8', fontSize: 13.5, padding: '40px 0', justifyContent: 'center' }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,122,51,0.3)', borderTopColor: '#FF7A33', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Breaking this down...</div>}
        {stage === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STEPS_DEMO.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', borderRadius: 10, background: 'rgba(255,122,51,0.06)', border: '1px solid rgba(255,122,51,0.14)', opacity: i < visibleSteps ? 1 : 0, transform: i < visibleSteps ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.35s ease, transform 0.35s ease' }}>
                <div>
                  <div style={{ color: '#F2F0E8', fontSize: 13.5, fontWeight: 500 }}>{s.label}</div>
                  <div style={{ color: '#8C8A7E', fontSize: 11.5, marginTop: 2 }}>{s.day}</div>
                </div>
                <div style={{ color: '#FF9A5C', fontSize: 12, fontWeight: 600 }}>{s.time}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Hero({ onTryFree }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '90px 48px 100px', maxWidth: 1280, margin: '0 auto', gap: 60, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 480px', minWidth: 320 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(255,122,51,0.25)', background: 'rgba(255,122,51,0.08)', fontSize: 13, color: '#FF9A5C', marginBottom: 28, fontFamily: 'Inter, sans-serif' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF7A33' }} /> Autonomous task agents, live
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 1.05, color: '#F2F0E8', letterSpacing: '-0.02em', margin: 0 }}>
          Deadlines don't<br /><span style={{ background: 'linear-gradient(90deg, #FF7A33, #FF4D6D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sneak up on you.</span>
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, lineHeight: 1.65, color: '#A8A696', marginTop: 22, maxWidth: 440 }}>Type a task in plain English. Three AI agents break it down, find time on your calendar, and chase you down until it's actually done.</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
          <button onClick={onTryFree} style={{ padding: '14px 26px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #FF7A33, #FF4D6D)', color: '#0B0E14', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 12px 30px -10px rgba(255,90,60,0.5)' }}>Try it free →</button>
          <button style={{ padding: '14px 26px', borderRadius: 11, border: '1px solid rgba(242,240,232,0.16)', background: 'transparent', color: '#F2F0E8', fontWeight: 500, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>See how it works</button>
        </div>
      </div>
      <LiveDemo />
    </div>
  );
}

function AgentCard({ tag, title, desc, color }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(242,240,232,0.08)', borderRadius: 18, padding: 28, flex: '1 1 280px', minWidth: 260, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.06em', color, marginBottom: 14, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>{tag}</div>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, color: '#F2F0E8', margin: '0 0 10px', fontWeight: 600 }}>{title}</h3>
      <p style={{ color: '#9C9A8E', fontSize: 14.5, lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    </div>
  );
}

function Agents() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 48px 100px' }}>
      <div style={{ marginBottom: 44, maxWidth: 560 }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, color: '#F2F0E8', fontWeight: 700, letterSpacing: '-0.01em', margin: '0 0 12px' }}>Three agents. One job: get it done.</h2>
        <p style={{ color: '#9C9A8E', fontSize: 15.5, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>Not another reminder app. Each agent owns a different part of the problem, and they hand off to each other automatically.</p>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <AgentCard tag="Agent 01" color="#FF9A5C" title="Planner" desc="Reads your task and splits it into concrete steps with realistic time estimates — no input needed from you." />
        <AgentCard tag="Agent 02" color="#FF7A9C" title="Scheduler" desc="Scans your Google Calendar for real free time and books each step automatically, before you forget." />
        <AgentCard tag="Agent 03" color="#FFB347" title="Nudge" desc="Watches your progress. Falls behind? It escalates — reminder, warning, then a full auto-reschedule." />
      </div>
    </div>
  );
}

function StatBar() {
  const stats = [
    { value: '3', label: 'agents working for you' },
    { value: '0', label: 'clicks to schedule a task' },
    { value: '24/7', label: 'deadline monitoring' },
  ];
  return (
    <div style={{ borderTop: '1px solid rgba(242,240,232,0.08)', borderBottom: '1px solid rgba(242,240,232,0.08)', padding: '40px 48px', display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap' }}>
      {stats.map(s => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: '#FF7A33' }}>{s.value}</div>
          <div style={{ color: '#8C8A7E', fontSize: 13, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function CTA({ onTryFree }) {
  return (
    <div style={{ textAlign: 'center', padding: '110px 48px' }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(30px, 4vw, 44px)', color: '#F2F0E8', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 16px' }}>Stop managing tasks.<br />Start finishing them.</h2>
      <p style={{ color: '#9C9A8E', fontSize: 16, marginBottom: 32, fontFamily: 'Inter, sans-serif' }}>Free to try. No credit card. Just type your first task.</p>
      <button onClick={onTryFree} style={{ padding: '15px 32px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #FF7A33, #FF4D6D)', color: '#0B0E14', fontWeight: 600, fontSize: 15.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 16px 40px -12px rgba(255,90,60,0.55)' }}>Get started — it's free</button>
    </div>
  );
}

// ==========================================
// DEFAULT LANDING EXPORT
// ==========================================
export default function LandingPage({ onTryFree }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0E14', backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(255,122,51,0.08), transparent 50%)' }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <NavBar />
      <Hero onTryFree={onTryFree} />
      <StatBar />
      <Agents />
      <CTA onTryFree={onTryFree} />
    </div>
  );
}