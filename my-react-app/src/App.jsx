import { useState } from 'react'
import './App.css'

function App() {
  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', employeeId: '' });

  const addEmployee = () => {
    if (newEmployee.name.trim() && newEmployee.employeeId.trim()) {
      setEmployees([
        ...employees,
        {
          id: Date.now(),
          name: newEmployee.name.trim(),
          employeeId: newEmployee.employeeId.trim(),
          clockInTime: null,
          clockOutTime: null,
          status: 'not-clocked-in',
          hoursWorked: 0,
        },
      ]);
      setNewEmployee({ name: '', employeeId: '' });
    }
  };

  const clockIn = (empId) => {
    setEmployees(
      employees.map((emp) =>
        emp.id === empId
          ? { ...emp, clockInTime: new Date(), status: 'clocked-in' }
          : emp
      )
    );
  };

  const clockOut = (empId) => {
    setEmployees(
      employees.map((emp) => {
        if (emp.id === empId && emp.clockInTime) {
          const hours = (new Date() - emp.clockInTime) / (1000 * 60 * 60);
          return {
            ...emp,
            clockOutTime: new Date(),
            status: 'clocked-out',
            hoursWorked: hours.toFixed(2),
          };
        }
        return emp;
      })
    );
  };

  const removeEmployee = (empId) => {
    setEmployees(employees.filter((emp) => emp.id !== empId));
  };

  const formatTime = (date) => {
    return date ? new Date(date).toLocaleTimeString() : '-';
  };

  return (
    <div className="container">
      <div className="App">
        <h1>Work Attendance System</h1>
        
        <div className="add-employee-section">
        <h2>Add Employee</h2>
        <input
          type="text"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          placeholder="Employee Name"
        />
        <input
          type="text"
          value={newEmployee.employeeId}
          onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
          placeholder="Employee ID"
        />
        <button onClick={addEmployee} className="btn-add">
          Add Employee
        </button>
      </div>

      <div className="attendance-section">
        <h2>Attendance Records</h2>
        {employees.length === 0 ? (
          <p>No employees added yet.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th>Clock In Time</th>
                <th>Clock Out Time</th>
                <th>Hours Worked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className={`status-${emp.status}`}>
                  <td>{emp.name}</td>
                  <td>{emp.employeeId}</td>
                  <td className="status">{emp.status.replace('-', ' ').toUpperCase()}</td>
                  <td>{formatTime(emp.clockInTime)}</td>
                  <td>{formatTime(emp.clockOutTime)}</td>
                  <td>{emp.hoursWorked} hrs</td>
                  <td className="actions">
                    {emp.status === 'not-clocked-in' && (
                      <button onClick={() => clockIn(emp.id)} className="btn-clock-in">
                        Clock In
                      </button>
                    )}
                    {emp.status === 'clocked-in' && (
                      <button onClick={() => clockOut(emp.id)} className="btn-clock-out">
                        Clock Out
                      </button>
                    )}
                    <button onClick={() => removeEmployee(emp.id)} className="btn-remove">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </div>
  );
}

export default App;
