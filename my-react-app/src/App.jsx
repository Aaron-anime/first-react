import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', employeeId: '', department: '', position: '', shift: '8-5' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('attendance'); 
  const [role, setRole] = useState('dev'); 
  const [currentEmpId, setCurrentEmpId] = useState(null);

  const formatTime = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '-';
    }
  };


  const computeHoursWorkedForRecord = (record) => {
    if (!record) return 0;
    
    const clockInIso = record.clockIn;
    const clockOutIso = record.clockOut;
    
    if (!clockInIso || !clockOutIso) return 0;
    
    try {
      let diff = new Date(clockOutIso) - new Date(clockInIso);
      const breaks = record.breaks || [];
      
      breaks.forEach((b) => {
        const s = b.start;
        const e = b.end;
        if (s && e) {
          diff -= (new Date(e) - new Date(s));
        }
      });
      
      const hours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
      return hours >= 0 ? hours : 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('attendanceData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setEmployees(data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (role === 'WE TEAM') {
      setView('reports');
    } else if (role === 'employee') {
      setView('attendance');
      if (employees.length > 0 && !currentEmpId) {
        setCurrentEmpId(employees[0].id);
      }
    } else if (role === 'dev') {
      setView('employees');
    }
  }, [role]);

  useEffect(() => {
    localStorage.setItem('attendanceData', JSON.stringify(employees));
  }, [employees]);

  const addEmployee = () => {
    if (newEmployee.name.trim() && newEmployee.employeeId.trim()) {
      const existingEmployee = employees.find(emp => emp.employeeId === newEmployee.employeeId.trim());
      if (existingEmployee) {
        alert('Employee ID already exists!');
        return;
      }

      setEmployees([
        ...employees,
        {
          id: Date.now(),
          name: newEmployee.name.trim(),
          employeeId: newEmployee.employeeId.trim(),
          department: newEmployee.department.trim(),
          position: newEmployee.position.trim(),
          shift: newEmployee.shift,
          attendanceRecords: {},
        },
      ]);
      setNewEmployee({ name: '', employeeId: '', department: '', position: '', shift: '8-5' });
    } else {
      alert('Please fill in Name and Employee ID');
    }
  };

  const clockIn = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today] || { date: today, status: 'present', breaks: [] };
          if (record.clockIn && !record.clockOut) {
            alert('Already clocked in!');
            return emp;
          }
          
          const updated = {
            ...record,
            clockIn: new Date().toISOString(),
            clockOut: null,
            status: 'present',
            breaks: [], 
            onBreak: false,
          };
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: updated,
            },
          };
        }
        return emp;
      })
    );
  };

  const clockOut = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today];
          
          if (!record || !record.clockIn) {
            alert('Must clock in first!');
            return emp;
          }
          
          if (record.clockOut) {
            alert('Already clocked out!');
            return emp;
          }
          let updatedRecord = { ...record };
          if (record.onBreak && record.breakStart) {
            const newBreak = {
              start: record.breakStart,
              end: new Date().toISOString(),
            };
            updatedRecord.breaks = [...(record.breaks || []), newBreak];
            updatedRecord.onBreak = false;
            updatedRecord.breakStart = null;
          }
          
          updatedRecord.clockOut = new Date().toISOString();
          updatedRecord.status = 'present';
          
          const hoursWorked = computeHoursWorkedForRecord(updatedRecord);
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                ...updatedRecord,
                hoursWorked,
              },
            },
          };
        }
        return emp;
      })
    );
  };

  const startBreak = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today];
          
          if (!record || !record.clockIn) {
            alert('Must clock in before taking a break!');
            return emp;
          }
          
          if (record.clockOut) {
            alert('Cannot take break after clocking out!');
            return emp;
          }
          
          if (record.onBreak) {
            alert('Already on break!');
            return emp;
          }
          
          const updated = {
            ...record,
            breakStart: new Date().toISOString(),
            onBreak: true,
          };
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: updated,
            },
          };
        }
        return emp;
      })
    );
  };

  const endBreak = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today];
          
          if (!record || !record.onBreak || !record.breakStart) {
            alert('No active break to end!');
            return emp;
          }
          
          const newBreak = {
            start: record.breakStart,
            end: new Date().toISOString(),
          };
          
          const updated = {
            ...record,
            breaks: [...(record.breaks || []), newBreak],
            onBreak: false,
            breakStart: null,
          };
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: updated,
            },
          };
        }
        return emp;
      })
    );
  };

  const markAbsent = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today];

          if (record?.clockIn) {
            alert('Cannot mark as absent - employee has already clocked in!');
            return emp;
          }
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                date: today,
                status: 'absent',
              },
            },
          };
        }
        return emp;
      })
    );
  };

  const markLeave = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today];

          if (record?.clockIn) {
            alert('Cannot mark as leave - employee has already clocked in!');
            return emp;
          }
          
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                date: today,
                status: 'leave',
              },
            },
          };
        }
        return emp;
      })
    );
  };

  const removeEmployee = (empId) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      setEmployees(employees.filter((emp) => emp.id !== empId));
      if (currentEmpId === empId) {
        setCurrentEmpId(null);
      }
    }
  };

  const getAttendanceStatus = (emp) => {
    const record = emp.attendanceRecords[selectedDate];
    return record ? record.status : 'not-marked';
  };

  const calculateDailyStats = () => {
    const present = employees.filter((emp) => getAttendanceStatus(emp) === 'present').length;
    const absent = employees.filter((emp) => getAttendanceStatus(emp) === 'absent').length;
    const leave = employees.filter((emp) => getAttendanceStatus(emp) === 'leave').length;
    const notMarked = employees.filter((emp) => getAttendanceStatus(emp) === 'not-marked').length;
    return { present, absent, leave, notMarked };
  };

  const getTotalHoursWorked = (emp) => {
    const record = emp.attendanceRecords[selectedDate];
    if (!record) return 0;

    if (record.hoursWorked !== undefined) return record.hoursWorked;
    
    return computeHoursWorkedForRecord(record);
  };

  const getBreakSummary = (emp) => {
    const record = emp.attendanceRecords[selectedDate];
    if (!record || !record.breaks || record.breaks.length === 0) return '0h 0m';
    
    let totalMinutes = 0;
    record.breaks.forEach((brk) => {
      const s = brk.start;
      const e = brk.end;
      if (s && e) {
        try {
          const start = new Date(s);
          const end = new Date(e);
          totalMinutes += (end - start) / (1000 * 60);
        } catch {
        }
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const exportData = () => {
    const dataStr = JSON.stringify(employees, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            setEmployees(data);
            alert('Data imported successfully!');
          } else {
            alert('Invalid data format!');
          }
        } catch (error) {
          alert('Error importing data: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const stats = calculateDailyStats();

  return (
    <div className="container">
      <div className="App">
        <h1>🏢 Attendance System</h1>

        <div className="tabs">
          <div className="role-select">
            <label>Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="dev">Dev (manage employees)</option>
              <option value="WE TEAM">WE TEAM (view reports)</option>
              <option value="employee">Employee (clock in/out)</option>
            </select>
          </div>

          {role !== 'WE TEAM' && (
            <button
              className={`tab-btn ${view === 'attendance' ? 'active' : ''}`}
              onClick={() => setView('attendance')}
            >
              Daily Attendance
            </button>
          )}

          {role === 'dev' && (
            <button
              className={`tab-btn ${view === 'employees' ? 'active' : ''}`}
              onClick={() => setView('employees')}
            >
              Manage Employees
            </button>
          )}

          {role !== 'employee' && (
            <button
              className={`tab-btn ${view === 'reports' ? 'active' : ''}`}
              onClick={() => setView('reports')}
            >
              Reports
            </button>
          )}
        </div>

        {role === 'employee' && (
          <div className="employee-self-select">
            <label>Signed in as:</label>
            <select value={currentEmpId || ''} onChange={(e) => setCurrentEmpId(Number(e.target.value))}>
              <option value="">-- select employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
        )}

        {view === 'attendance' && (
          <>
            <div className="date-selector">
              <label>Select Date: </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="stats-container">
              <div className="stat-card present">
                <h3>Present</h3>
                <p>{stats.present}</p>
              </div>
              <div className="stat-card absent">
                <h3>Absent</h3>
                <p>{stats.absent}</p>
              </div>
              <div className="stat-card leave">
                <h3>Leave</h3>
                <p>{stats.leave}</p>
              </div>
              <div className="stat-card not-marked">
                <h3>Not Marked</h3>
                <p>{stats.notMarked}</p>
              </div>
            </div>

            <div className="attendance-section">
              <h2>Attendance Records</h2>
              {employees.length === 0 ? (
                <p className="empty-state">No employees added yet. Add employees in the "Manage Employees" section.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Hours Worked</th>
                        <th>Break Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        role === 'employee'
                          ? employees.filter((e) => e.id === currentEmpId)
                          : employees
                      ).map((emp) => {
                        const record = emp.attendanceRecords[selectedDate];
                        const status = getAttendanceStatus(emp);
                        return (
                          <tr key={emp.id} className={`status-${status}`}>
                            <td>{emp.name}</td>
                            <td>{emp.employeeId}</td>
                            <td>{emp.department || '-'}</td>
                            <td>{formatTime(record?.clockIn)}</td>
                            <td>{formatTime(record?.clockOut)}</td>
                            <td>{getTotalHoursWorked(emp).toFixed(2)} hrs</td>
                            <td>{getBreakSummary(emp)}</td>
                            <td className="status">
                              <span className={`badge ${status}`}>
                                {status === 'not-marked' ? 'NOT MARKED' : status.toUpperCase()}
                              </span>
                            </td>
                            <td className="actions">
                              {(() => {
                                const canAct = role === 'dev' || (role === 'employee' && emp.id === currentEmpId);
                                if (!canAct) return <em>Not permitted</em>;

                                return (
                                  <>
                                    {status === 'not-marked' || status === 'present' ? (
                                      <>
                                        {!record?.clockIn && (
                                          <button onClick={() => clockIn(emp.id)} className="btn-clock-in">
                                            Clock In
                                          </button>
                                        )}
                                        {record?.clockIn && !record?.clockOut && (
                                          <>
                                            {record?.onBreak ? (
                                              <button onClick={() => endBreak(emp.id)} className="btn-break-end">
                                                End Break
                                              </button>
                                            ) : (
                                              <button onClick={() => startBreak(emp.id)} className="btn-break">
                                                Start Break
                                              </button>
                                            )}
                                            <button onClick={() => clockOut(emp.id)} className="btn-clock-out">
                                              Clock Out
                                            </button>
                                          </>
                                        )}
                                        {record?.clockIn && record?.clockOut && (
                                          <span className="completed">✓ Completed</span>
                                        )}
                                      </>
                                    ) : null}
                                    {status === 'not-marked' && role === 'dev' && (
                                      <>
                                        <button onClick={() => markAbsent(emp.id)} className="btn-absent">
                                          Mark Absent
                                        </button>
                                        <button onClick={() => markLeave(emp.id)} className="btn-leave">
                                          Mark Leave
                                        </button>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'employees' && (
          <div className="employees-section">
            <div className="section-header">
              <h2>Add New Employee</h2>
              <div className="data-actions">
                <button onClick={exportData} className="btn-export">
                  Export Data
                </button>
                <label className="btn-import">
                  Import Data
                  <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            
            <div className="employee-form">
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Full Name *"
                required
              />
              <input
                type="text"
                value={newEmployee.employeeId}
                onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                placeholder="Employee ID *"
                required
              />
              <input
                type="text"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                placeholder="Department"
              />
              <input
                type="text"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                placeholder="Position"
              />
              <select
                value={newEmployee.shift}
                onChange={(e) => setNewEmployee({ ...newEmployee, shift: e.target.value })}
              >
                <option value="8-5">8:00 AM - 5:00 PM</option>
                <option value="8:30-5:30">8:30 AM - 5:30 PM</option>
                <option value="9-6">9:00 AM - 6:00 PM</option>
                <option value="night">Night Shift</option>
              </select>
              <button onClick={addEmployee} className="btn-add">
                Add Employee
              </button>
            </div>

            <h2>Employee Directory ({employees.length})</h2>
            <div className="employees-list">
              {employees.length === 0 ? (
                <p className="empty-state">No employees added yet.</p>
              ) : (
                employees.map((emp) => (
                  <div key={emp.id} className="employee-card">
                    <div className="emp-info">
                      <h3>{emp.name}</h3>
                      <p><strong>ID:</strong> {emp.employeeId}</p>
                      <p><strong>Department:</strong> {emp.department || 'N/A'}</p>
                      <p><strong>Position:</strong> {emp.position || 'N/A'}</p>
                      <p><strong>Shift:</strong> {emp.shift}</p>
                    </div>
                    <button onClick={() => removeEmployee(emp.id)} className="btn-remove">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'reports' && (
          <div className="reports-section">
            <h2>Attendance Reports</h2>
            <div className="report-container">
              <h3>Employee Overview</h3>
              {employees.length === 0 ? (
                <p className="empty-state">No employee data available.</p>
              ) : (
                <div className="report-stats">
                  {employees.map((emp) => {
                    const presentDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'present').length;
                    const absentDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'absent').length;
                    const leaveDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'leave').length;
                    const totalHours = Object.values(emp.attendanceRecords).reduce((sum, r) => {
                      if (r.hoursWorked !== undefined) return sum + r.hoursWorked;
                      return sum + computeHoursWorkedForRecord(r);
                    }, 0);
                    
                    return (
                      <div key={emp.id} className="report-card">
                        <h4>{emp.name}</h4>
                        <p className="emp-id">Employee ID: {emp.employeeId}</p>
                        <p className="emp-dept">{emp.department || 'No Department'} - {emp.position || 'No Position'}</p>
                        <div className="report-details">
                          <div className="stat-item">
                            <span className="stat-label">Present Days</span>
                            <strong className="stat-value">{presentDays}</strong>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Absent Days</span>
                            <strong className="stat-value">{absentDays}</strong>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Leave Days</span>
                            <strong className="stat-value">{leaveDays}</strong>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Total Hours</span>
                            <strong className="stat-value">{totalHours.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;