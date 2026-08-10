import React, { useState } from 'react';

interface ScheduleClassModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

const defaultDays = [
    { id: 1, name: 'Monday', selected: true, startTime: '', endTime: '' },
    { id: 2, name: 'Tuesday', selected: false, startTime: '', endTime: '' },
    { id: 3, name: 'Wednesday', selected: true, startTime: '', endTime: '' },
    { id: 4, name: 'Thursday', selected: true, startTime: '', endTime: '' },
    { id: 5, name: 'Friday', selected: true, startTime: '', endTime: '' },
    { id: 6, name: 'Saturday', selected: true, startTime: '', endTime: '' },
    { id: 7, name: 'Sunday', selected: false, startTime: '', endTime: '' },
];

const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ show, onClose, onSave }) => {
    const [courseType, setCourseType] = useState('Theory with Lab');
    const [course, setCourse] = useState('');
    const [batch, setBatch] = useState('');
    const [days, setDays] = useState(defaultDays);

    if (!show) return null;

    const handleDayToggle = (id: number) => {
        setDays(days.map(d => d.id === id ? { ...d, selected: !d.selected } : d));
    };

    const handleTimeChange = (id: number, field: 'startTime' | 'endTime', value: string) => {
        setDays(days.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ courseType, course, batch, days: days.filter(d => d.selected) });
    };

    return (
        <div style={popupOverlay}>
            <div style={popupBox}>
                <div style={headerStyle}>
                    <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>Schedule Class</h2>
                    <button type="button" onClick={onClose} style={closeBtnStyle}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={rowStyle}>
                        <div style={colStyle}>
                            <label style={labelStyle}>Course Type: <span style={{ color: 'red' }}>*</span></label>
                            <select value={courseType} onChange={(e) => setCourseType(e.target.value)} style={selectStyle}>
                                <option value="Theory with Lab">Theory with Lab</option>
                                <option value="Theory">Theory</option>
                                <option value="Practical">Practical</option>
                            </select>
                        </div>
                        <div style={colStyle}>
                            <label style={labelStyle}>Course: <span style={{ color: 'red' }}>*</span></label>
                            <select value={course} onChange={(e) => setCourse(e.target.value)} style={selectStyle}>
                                <option value="">Select Course</option>
                                <option value="Break">Break</option>
                                <option value="ACVC401 - Fluid Mechanics and Hydraulic Machines">ACVC401 - Fluid Mechanics and Hydraulic Machines</option>
                                <option value="ACVC402 - Transportation Engineering">ACVC402 - Transportation Engineering</option>
                            </select>
                        </div>
                        <div style={colStyle}>
                            <label style={labelStyle}>Batch: <span style={{ color: 'red' }}>*</span></label>
                            <select value={batch} onChange={(e) => setBatch(e.target.value)} style={selectStyle}>
                                <option value="">Select Batch</option>
                                <option value="Batch 1">Batch 1</option>
                                <option value="Batch 2">Batch 2</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                            <div style={{ width: '120px', fontWeight: 600, fontSize: '14px' }}>Day</div>
                            <div style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>Class Start Time</div>
                            <div style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>Class End Time</div>
                        </div>

                        {days.map((day) => (
                            <div key={day.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ width: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={day.selected}
                                        onChange={() => handleDayToggle(day.id)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '14px' }}>{day.name}</span>
                                </div>
                                <div style={{ flex: 1, paddingRight: '15px' }}>
                                    <input
                                        type="time"
                                        value={day.startTime}
                                        disabled={!day.selected}
                                        onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                                        style={timeInputStyle(day.selected)}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="time"
                                        value={day.endTime}
                                        disabled={!day.selected}
                                        onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                                        style={timeInputStyle(day.selected)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={footerStyle}>
                        <button type="submit" style={btnSaveStyle}>
                            <span style={{ marginRight: '5px' }}>💾</span> Save
                        </button>
                        <button type="button" onClick={onClose} style={btnCancelStyle}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Styles
const popupOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
};

const popupBox: React.CSSProperties = {
    backgroundColor: "#fff",
    width: "700px",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    overflow: "hidden"
};

const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    backgroundColor: '#f8f9fc',
    borderBottom: '1px solid #e3e6f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#858796'
};

const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    marginBottom: '10px'
};

const colStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
};

const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '5px',
    color: '#495057'
};

const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #d1d3e2',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#6e707e',
    width: '100%',
    outline: 'none'
};

const timeInputStyle = (enabled: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #d1d3e2',
    fontSize: '14px',
    backgroundColor: enabled ? '#fff' : '#eaecf4',
    color: '#6e707e',
    outline: 'none'
});

const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e3e6f0'
};

const btnSaveStyle: React.CSSProperties = {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
};

const btnCancelStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: '#6c757d',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer'
};

export default ScheduleClassModal;
