import React from 'react';

const AssignedRequests = ({ requests }) => {
  const assigned = requests.filter(req => req.assigned_to).length;
  return (
    <div className="metric-card">
      <h4>Assigned Requests</h4>
      <p>{assigned}</p>
    </div>
  );
};

export default AssignedRequests;