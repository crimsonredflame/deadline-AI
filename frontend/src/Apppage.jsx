import React, { useState, useRef } from 'react';

// Keep your constants and helper functions at the top
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);
const COLORS = [
  { bg: 'rgba(255,122,51,0.16)', border: 'rgba(255,122,51,0.4)', text: '#FF9A5C' },
  { bg: 'rgba(255,77,109,0.16)', border: 'rgba(255,77,109,0.4)', text: '#FF7A9C' },
  { bg: 'rgba(94,178,255,0.16)', border: 'rgba(94,178,255,0.4)', text: '#7EC2FF' },
];

function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h;
  return `${hh}${period}`;
}

export default function AppPage({ onBack }) {
  const [blocks, setBlocks] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [thinking, setThinking] = useState(false);
  const colorCounter = useRef(0);

  const handleAddTask = async (text) => {
    setThinking(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text })
      });
      const data = await response.json();
      
      // Map API steps to calendar blocks
      const newBlocks = data.steps.map((step, i) => ({
        id: `${Date.now()}-${i}`,
        label: step.label,
        taskLabel: text,
        day: i % 7, // Adjust this logic based on your backend output
        startHour: 9 + i, 
        durationMin: 60,
        color: COLORS[colorCounter.current % COLORS.length]
      }));

      colorCounter.current += 1;
      setBlocks(prev => [...prev, ...newBlocks]);
      setTaskList(prev => [...prev, { label: text, stepCount: newBlocks.length, color: newBlocks[0].color }]);
    } catch (err) {
      alert("Backend error! Make sure main.py is running.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0E14', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(242,240,232,0.08)' }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(242,240,232,0.14)', borderRadius: 8, padding: '7px 12px', color: '#B8B6A8', cursor: 'pointer' }}>← Back</button>
        <span style={{ fontWeight: 700, fontSize: 16.5, color: '#F2F0E8' }}>Sorted Focus</span>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Input Side */}
        <div style={{ width: 340, padding: 24, borderRight: '1px solid rgba(242,240,232,0.08)' }}>
          <textarea id="taskInput" placeholder="e.g. submit ML assignment" rows={3} style={{ width: '100%', background: '#11151D', color: 'white', padding: 12, borderRadius: 10, border: '1px solid #333' }} />
          <button 
            disabled={thinking}
            onClick={() => handleAddTask(document.getElementById('taskInput').value)}
            style={{ width: '100%', marginTop: 10, padding: 12, background: '#FF7A33', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            {thinking ? 'Planning...' : 'Plan & Schedule'}
          </button>
        </div>

        {/* Calendar Side */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <div style={{ display: 'flex' }}>
            {DAYS.map((d, dayIdx) => (
              <div key={d} style={{ width: 130, borderLeft: '1px solid #222' }}>
                <div style={{ textAlign: 'center', color: '#9C9A8E', paddingBottom: 10 }}>{d}</div>
                {HOURS.map(h => (
                  <div key={h} style={{ height: 52, borderBottom: '1px solid #222' }}>
                    {blocks.filter(b => b.day === dayIdx && b.startHour === h).map(b => (
                      <div key={b.id} style={{ background: b.color.bg, padding: 5, borderRadius: 5, fontSize: 11, color: b.color.text }}>{b.label}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}