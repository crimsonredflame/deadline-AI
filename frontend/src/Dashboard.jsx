import React, { useState } from 'react';

export default function Dashboard() {
  // Same orange, same dark background
  const theme = {
    bg: '#0B0E14',
    card: '#11151D',
    accent: '#FF7A33',
    text: '#F2F0E8',
    border: 'rgba(242,240,232,0.12)'
  };

  const timeSlots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM", "09:00 PM"];

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, padding: '40px', fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, marginBottom: 30 }}>Sorted Focus View</h2>
      
      <div style={{ display: 'flex', gap: 40 }}>
        {/* Task Input Section */}
        <div style={{ width: 350 }}>
          <input placeholder="Type a task..." style={{ 
            width: '100%', padding: '14px', background: theme.card, 
            border: `1px solid ${theme.border}`, borderRadius: 10, color: 'white' 
          }} />
          <button style={{ 
            width: '100%', marginTop: 15, padding: '14px', border: 'none',
            background: `linear-gradient(135deg, ${theme.accent}, #FF4D6D)`,
            borderRadius: 10, color: '#0B0E14', fontWeight: 700, cursor: 'pointer'
          }}>Plan it</button>
        </div>

        {/* Grid View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {timeSlots.map(time => (
            <div key={time} style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, padding: '20px 0' }}>
              <div style={{ width: 100, color: '#8C8A7E', fontSize: 13 }}>{time}</div>
              <div style={{ flex: 1, background: theme.card, borderRadius: 10, padding: '15px', minHeight: 60 }}>
                {/* AI-scheduled task will go here */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}