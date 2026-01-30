import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', employeeId: '', department: '', position: '', shift: '8-5' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('attendance'); 
  const [breakTime, setBreakTime] = useState({});
  const [role, setRole] = useState('dev'); 
  const [currentEmpId, setCurrentEmpId] = useState(null);

  
  useEffect(() => {
    const saved = localStorage.getItem('attendanceData');
    if (saved) {
      setEmployees(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (role === 'WE TEAM') {
      setView('reports');
    } else if (role === 'employee') {
      setView('attendance');
      if (employees.length > 0) setCurrentEmpId(employees[0].id);
    } else if (role === 'dev') {
      setView('employees');
    }
  }, [role, employees]);

  useEffect(() => {
    localStorage.setItem('attendanceData', JSON.stringify(employees));
  }, [employees]);

  const addEmployee = () => {
    if (newEmployee.name.trim() && newEmployee.employeeId.trim()) {
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
      setNewEmployee({ name: '', employeeId: '', department: '', position: '', shift: '9-5' });
    }
  };

  const clockIn = (empId) => {
    const today = selectedDate;
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId) {
          const record = emp.attendanceRecords[today] || { date: today, status: 'present', breaks: [] };
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                ...record,
                clockInTime: new Date().toLocaleTimeString(),
                status: 'present',
              },
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
          const record = emp.attendanceRecords[today] || { date: today, status: 'present', breaks: [] };
          const inTime = record.clockInTime ? new Date(`${today} ${record.clockInTime}`) : null;
          const outTime = new Date();
          let hoursWorked = 0;
          if (inTime) {
            hoursWorked = ((outTime - inTime) / (1000 * 60 * 60)).toFixed(2);
          }
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                ...record,
                clockOutTime: new Date().toLocaleTimeString(),
                hoursWorked: parseFloat(hoursWorked),
                status: 'present',
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
          const record = emp.attendanceRecords[today] || { date: today, status: 'present', breaks: [] };
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                ...record,
                breakStartTime: new Date().toLocaleTimeString(),
                onBreak: true,
              },
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
          const record = emp.attendanceRecords[today] || { date: today, status: 'present', breaks: [] };
          const newBreak = {
            start: record.breakStartTime,
            end: new Date().toLocaleTimeString(),
          };
          return {
            ...emp,
            attendanceRecords: {
              ...emp.attendanceRecords,
              [today]: {
                ...record,
                breaks: [...(record.breaks || []), newBreak],
                onBreak: false,
                breakStartTime: null,
              },
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
    setEmployees(employees.filter((emp) => emp.id !== empId));
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
    return record?.hoursWorked || 0;
  };

  const getBreakSummary = (emp) => {
    const record = emp.attendanceRecords[selectedDate];
    if (!record || !record.breaks) return '0h 0m';
    let totalMinutes = 0;
    record.breaks.forEach((brk) => {
      if (brk.start && brk.end) {
        const start = new Date(`${selectedDate} ${brk.start}`);
        const end = new Date(`${selectedDate} ${brk.end}`);
        totalMinutes += (end - start) / (1000 * 60);
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const stats = calculateDailyStats();

  return (
    <div className="container">
      <div className="App">
        <h1> Attendance System</h1>

        <div className="tabs">
          <div className="role-select">
            <label>Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="dev">Dev (manage employees)</option>
              <option value="WE TEAM"> WE TEAM (view reports)</option>
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
                <p>No employees added yet.</p>
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
                            <td>{record?.clockInTime || '-'}</td>
                            <td>{record?.clockOutTime || '-'}</td>
                            <td>{getTotalHoursWorked(emp)} hrs</td>
                            <td>{getBreakSummary(emp)}</td>
                            <td className="status">
                              <span className={`badge ${status}`}>{status.replace('-', ' ').toUpperCase()}</span>
                            </td>
                            <td className="actions">
                              {(() => {
                                const canAct = role === 'dev' || (role === 'employee' && emp.id === currentEmpId);
                                if (!canAct) return <em>Not permitted</em>;

                                return (
                                  <>
                                    {status === 'not-marked' || status === 'present' ? (
                                      <>
                                        {!record?.clockInTime && (
                                          <button onClick={() => clockIn(emp.id)} className="btn-clock-in">
                                            Clock In
                                          </button>
                                        )}
                                        {record?.clockInTime && !record?.clockOutTime && (
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
                                        {record?.clockInTime && record?.clockOutTime && (
                                          <span className="completed">✓ Completed</span>
                                        )}
                                      </>
                                    ) : null}
                                    {status === 'not-marked' && (
                                      <>
                                        <button onClick={() => markAbsent(emp.id)} className="btn-absent">
                                          Absent
                                        </button>
                                        <button onClick={() => markLeave(emp.id)} className="btn-leave">
                                          Leave
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
            <h2>Add New Employee</h2>
            <div className="employee-form">
              <input
                type="text"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Full Name"
              />
              <input
                type="text"
                value={newEmployee.employeeId}
                onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                placeholder="Employee ID"
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
                <option value="8-5">8:00AM - 5:00PM</option>
                <option value="8:30-5:30">8:30AM - 5:30PM</option>
                <option value="9-6">9:00AM - 6:00PM</option>
                <option value="night">Night Shift</option>
              </select>
              <button onClick={addEmployee} className="btn-add">
                Add Employee
              </button>
            </div>

            <h2>Employee Directory</h2>
            <div className="employees-list">
              {employees.length === 0 ? (
                <p>No employees added yet.</p>
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
              <h3>Monthly Overview</h3>
              <div className="report-stats">
                {employees.map((emp) => {
                  const presentDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'present').length;
                  const absentDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'absent').length;
                  const leaveDays = Object.values(emp.attendanceRecords).filter((r) => r.status === 'leave').length;
                  const totalHours = Object.values(emp.attendanceRecords).reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
                  return (
                    <div key={emp.id} className="report-card">
                      <h4>{emp.name}</h4>
                      <p>Employee ID: {emp.employeeId}</p>
                      <div className="report-details">
                        <span>Present Days: <strong>{presentDays}</strong></span>
                        <span>Absent Days: <strong>{absentDays}</strong></span>
                        <span>Leave Days: <strong>{leaveDays}</strong></span>
                        <span>Total Hours: <strong>{totalHours.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;