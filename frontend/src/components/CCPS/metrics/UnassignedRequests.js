import React from 'react';

const UnassignedRequests = ({ requests }) => {
  const unassigned = requests.filter(req => !req.assigned_to).length;
  return (
    <div className="metric-card">
      <h4>Unassigned Requests</h4>
      <p>{unassigned}</p>
    </div>
  );
};

export default UnassignedRequests;